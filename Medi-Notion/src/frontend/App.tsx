/**
 * 메디게이트 앱 메인
 * @see docs/case1-notice-list/IA.md
 * @see docs/case2-notification/IA.md
 */

import React, { useState } from 'react';
import NoticeList from './components/NoticeList';
import NoticeDetail from './components/NoticeDetail';
import NotificationList from './components/NotificationList';
import { DrInsightPage } from '../features/dr-insight';
import { WelcomeNotification } from '../components/WelcomeNotification';

type Tab = 'notice' | 'notification' | 'insight';
type View = 'list' | 'detail';

const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('notice');
  const [view, setView] = useState<View>('list');
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null);

  const handleSelectNotice = (id: number) => {
    setSelectedNoticeId(id);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedNoticeId(null);
    setView('list');
  };

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setView('list');
    setSelectedNoticeId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <WelcomeNotification
        message="안녕하세요! 메디게이트입니다."
        autoShowDelay={500}
        autoHideDelay={4000}
      />
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleTabChange('notice')}
              className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                tab === 'notice'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 공지사항
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('notification')}
              className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                tab === 'notification'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🔔 알림
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('insight')}
              className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                tab === 'insight'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 Dr. Insight
            </button>
          </div>
        </div>
      </nav>

      {tab === 'notice' && (
        <>
          {view === 'list' && (
            <NoticeList onSelectNotice={handleSelectNotice} />
          )}
          {view === 'detail' && selectedNoticeId !== null && (
            <NoticeDetail noticeId={selectedNoticeId} onBack={handleBack} />
          )}
        </>
      )}

      {tab === 'notification' && <NotificationList />}

      {tab === 'insight' && <DrInsightPage />}
    </div>
  );
};

export default App;
