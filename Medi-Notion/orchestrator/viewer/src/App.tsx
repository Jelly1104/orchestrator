import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';
import { TaskDetail } from './components/TaskDetail';
import { FileTree } from './components/FileTree';
import { DocViewer } from './components/DocViewer';
import { CodeViewer } from './components/CodeViewer';
import { RunningBanner } from './components/RunningBanner';
import { WSStatus } from './components/WSStatus';
import { HITLPanel } from './components/HITLPanel';
import { AnalysisViewer } from './components/AnalysisViewer';
import { useTasks, useTaskDetail, useDocs, useFiles, useStats } from './hooks/useTasks';
import { useWebSocket, type WSMessage } from './hooks/useWebSocket';
import type { Tab } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<{ taskId: string; filename: string } | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [hitlOpen, setHitlOpen] = useState(false);
  const [hitlCount, setHitlCount] = useState(0);

  // Hooks
  const { tasks, loading: tasksLoading, refresh } = useTasks();
  const { detail, loading: detailLoading, error: detailError } = useTaskDetail(selectedTaskId);
  const { docs, getDocContent } = useDocs(selectedTaskId);
  const { files, loading: filesLoading, getFileContent } = useFiles();
  const stats = useStats(tasks);

  // HITL 대기열 조회
  const fetchHitlCount = useCallback(async () => {
    try {
      const res = await fetch('/api/hitl/queue');
      const data = await res.json();
      setHitlCount(data.length);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchHitlCount();
  }, [fetchHitlCount]);

  // WebSocket 메시지 핸들러
  const handleWSMessage = useCallback((msg: WSMessage) => {
    if (msg.type === 'task_created' || msg.type === 'task_updated') {
      refresh();
    }
    if (msg.type === 'hitl_pending') {
      setHitlCount(prev => prev + 1);
    }
    if (msg.type === 'hitl_resolved') {
      setHitlCount(prev => Math.max(0, prev - 1));
    }
  }, [refresh]);

  const { isConnected, runningTask, reconnect } = useWebSocket(handleWSMessage);

  // Load doc content
  useEffect(() => {
    if (selectedDoc) {
      getDocContent(selectedDoc.taskId, selectedDoc.filename)
        .then(setDocContent)
        .catch(() => setDocContent('문서를 불러올 수 없습니다.'));
    }
  }, [selectedDoc, getDocContent]);

  // Load file content
  useEffect(() => {
    if (selectedFilePath) {
      getFileContent(selectedFilePath)
        .then(setFileContent)
        .catch(() => setFileContent('파일을 불러올 수 없습니다.'));
    }
  }, [selectedFilePath, getFileContent]);

  // Select first task when list loads
  useEffect(() => {
    if (tasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(tasks[0].taskId);
    }
  }, [tasks, selectedTaskId]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    // Reset selections when changing tabs
    if (tab === 'dashboard') {
      // Keep task selection
    } else if (tab === 'files') {
      setSelectedFilePath(null);
      setFileContent('');
    } else if (tab === 'docs') {
      setSelectedDoc(null);
      setDocContent('');
    }
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    setSelectedDoc(null);
    setDocContent('');
  };

  const handleDocSelect = (taskId: string, filename: string) => {
    setSelectedDoc({ taskId, filename });
  };

  const handleFileSelect = (path: string) => {
    setSelectedFilePath(path);
  };

  return (
    <div className="flex flex-col h-screen bg-dark-bg text-gray-100">
      {/* Running Banner */}
      <RunningBanner runningTask={runningTask} />

      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-dark-card border-r border-dark-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-primary flex items-center gap-2">
              <span>🎯</span>
              <span>Orchestrator Viewer</span>
            </h1>
            <button
              onClick={() => setHitlOpen(true)}
              className={`relative p-2 rounded-lg transition-colors ${
                hitlCount > 0 ? 'bg-amber-500/20 hover:bg-amber-500/30' : 'hover:bg-secondary/30'
              }`}
              title="HITL 승인 대기열"
            >
              <span className="text-lg">🔔</span>
              {hitlCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {hitlCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-border">
          <TabButton
            active={activeTab === 'dashboard'}
            onClick={() => handleTabChange('dashboard')}
          >
            📊 대시보드
          </TabButton>
          <TabButton
            active={activeTab === 'logs'}
            onClick={() => handleTabChange('logs')}
          >
            📋 로그
          </TabButton>
          <TabButton
            active={activeTab === 'files'}
            onClick={() => handleTabChange('files')}
          >
            📁 파일
          </TabButton>
          <TabButton
            active={activeTab === 'analysis'}
            onClick={() => handleTabChange('analysis')}
          >
            📈 분석
          </TabButton>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          {(activeTab === 'dashboard' || activeTab === 'logs' || activeTab === 'analysis') && (
            <TaskList
              tasks={tasks}
              selectedId={selectedTaskId}
              onSelect={handleTaskSelect}
              loading={tasksLoading}
            />
          )}

          {activeTab === 'files' && (
            <FileTree
              files={files}
              selectedPath={selectedFilePath}
              onSelect={handleFileSelect}
              loading={filesLoading}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-dark-border">
          <button
            onClick={refresh}
            className="w-full py-2 px-4 bg-secondary hover:bg-secondary/80 rounded text-sm transition-colors"
          >
            🔄 새로고침
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="p-6">
            <Dashboard stats={stats} />

            {/* Doc buttons for selected task */}
            {selectedTaskId && docs.length > 0 && (
              <div className="mt-6 bg-dark-card rounded-lg p-4">
                <h3 className="font-semibold mb-3">설계 문서</h3>
                <div className="flex flex-wrap gap-2">
                  {docs.map(doc => (
                    <button
                      key={doc.name}
                      onClick={() => {
                        setActiveTab('docs');
                        handleDocSelect(selectedTaskId!, doc.name);
                      }}
                      className="px-3 py-1.5 bg-secondary/50 hover:bg-secondary rounded text-sm transition-colors"
                    >
                      📄 {doc.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <TaskDetail
            detail={detail}
            loading={detailLoading}
            error={detailError}
          />
        )}

        {activeTab === 'docs' && (
          selectedDoc && docContent ? (
            <DocViewer
              content={docContent}
              filename={selectedDoc.filename}
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              {selectedTaskId && docs.length > 0 ? (
                <div>
                  <p className="mb-4">문서를 선택하세요:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {docs.map(doc => (
                      <button
                        key={doc.name}
                        onClick={() => handleDocSelect(selectedTaskId!, doc.name)}
                        className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded transition-colors"
                      >
                        {doc.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p>좌측에서 태스크를 선택하면 문서를 볼 수 있습니다.</p>
              )}
            </div>
          )
        )}

        {activeTab === 'files' && (
          selectedFilePath && fileContent ? (
            <CodeViewer
              content={fileContent}
              filename={selectedFilePath.split('/').pop() || ''}
              language={getLanguage(selectedFilePath)}
            />
          ) : (
            <div className="p-8 text-center text-gray-500">
              좌측 트리에서 파일을 선택하세요.
            </div>
          )
        )}

        {activeTab === 'analysis' && (
          selectedTaskId ? (
            <div className="p-6">
              <AnalysisViewer taskId={selectedTaskId} />
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              좌측에서 태스크를 선택하면 분석 결과를 볼 수 있습니다.
            </div>
          )
        )}
      </main>
      </div>

      {/* WebSocket Status */}
      <WSStatus isConnected={isConnected} onReconnect={reconnect} />

      {/* HITL Panel */}
      <HITLPanel
        isOpen={hitlOpen}
        onClose={() => setHitlOpen(false)}
        onRefresh={() => {
          fetchHitlCount();
          refresh();
        }}
      />
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${
        active
          ? 'bg-primary text-white'
          : 'text-gray-400 hover:text-white hover:bg-secondary/30'
      }`}
    >
      {children}
    </button>
  );
}

function getLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'sql':
      return 'sql';
    case 'md':
      return 'markdown';
    case 'json':
      return 'json';
    default:
      return 'text';
  }
}

export default App;
