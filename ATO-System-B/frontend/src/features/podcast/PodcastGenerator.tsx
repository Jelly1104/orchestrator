import React, { useState } from 'react';
import { RawDataSummary, AudioMetadata } from '../../types/podcast';

interface PodcastGeneratorProps {
  className?: string;
}

export const PodcastGenerator: React.FC<PodcastGeneratorProps> = ({ className = '' }) => {
  const [currentPhase, setCurrentPhase] = useState<'extract' | 'generate'>('extract');
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<RawDataSummary | null>(null);
  const [script, setScript] = useState<string>('');
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const handleExtractData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/podcast/extract/preprocess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: selectedDate }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RawDataSummary = await response.json();
      setRawData(data);
      setCurrentPhase('generate');
    } catch (error) {
      console.error('Failed to extract data:', error);
      alert('데이터 추출에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!rawData) return;

    setLoading(true);
    try {
      const response = await fetch('/api/v1/podcast/generate/script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw_data_summary: rawData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const scriptText = await response.text();
      setScript(scriptText);

      // 메타데이터도 생성
      const metadataResponse = await fetch('/api/v1/podcast/generate/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script: scriptText }),
      });

      if (metadataResponse.ok) {
        const metadataData: AudioMetadata = await metadataResponse.json();
        setMetadata(metadataData);
      }
    } catch (error) {
      console.error('Failed to generate script:', error);
      alert('대본 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const downloadSqlQuery = async () => {
    try {
      const response = await fetch(`/api/v1/podcast/extract/best-posts?date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to download SQL');
      
      const sqlContent = await response.text();
      const blob = new Blob([sqlContent], { type: 'application/sql' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'best_posts_query.sql';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download SQL:', error);
    }
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          메디캐스트 팟캐스트 생성기
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setCurrentPhase('extract')}
            className={`px-4 py-2 rounded-lg ${
              currentPhase === 'extract'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Phase A - 데이터 추출
          </button>
          <button
            onClick={() => setCurrentPhase('generate')}
            className={`px-4 py-2 rounded-lg ${
              currentPhase === 'generate'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            disabled={!rawData}
          >
            Phase B - 팟캐스트 생성
          </button>
        </div>
      </div>

      {currentPhase === 'extract' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">🔍 베스트 게시물 추출</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 추출 날짜
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex space-x-4 mb-6">
            <button
              onClick={handleExtractData}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '추출 중...' : '📊 데이터 추출'}
            </button>
            <button
              onClick={downloadSqlQuery}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              💾 SQL 쿼리 다운로드
            </button>
          </div>

          {rawData && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">추출 결과</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="font-medium">추출일:</span> {rawData.extraction_date}
                </div>
                <div>
                  <span className="font-medium">게시물 수:</span> {rawData.total_posts}개
                </div>
              </div>
              
              <div className="space-y-3">
                {rawData.best_posts.map((post, index) => (
                  <div key={post.board_idx} className="border border-gray-100 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">
                        #{index + 1} {post.title}
                      </h4>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        참여도: {post.engagement_score}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{post.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {currentPhase === 'generate' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-6">🎙️ 팟캐스트 대본 생성</h2>
          
          <div className="mb-6">
            <button
              onClick={handleGenerateScript}
              disabled={loading || !rawData}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '생성 중...' : '📝 대본 생성'}
            </button>
          </div>

          {script && (
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">생성된 대본</h3>
                <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{script}</pre>
                </div>
              </div>

              {metadata && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">오디오 메타데이터</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">예상 재생시간:</span>{' '}
                      {Math.floor(metadata.total_estimated_duration / 60)}분{' '}
                      {metadata.total_estimated_duration % 60}초
                    </div>
                    <div>
                      <span className="font-medium">세그먼트 수:</span>{' '}
                      {metadata.segments.length}개
                    </div>
                    <div>
                      <span className="font-medium">음성:</span>{' '}
                      {metadata.audio_config.voice}
                    </div>
                    <div>
                      <span className="font-medium">속도:</span>{' '}
                      {metadata.audio_config.speaking_rate}x
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PodcastGenerator;