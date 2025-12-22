import { useState, useEffect } from 'react'
import { ragAPI } from '../api/client'
import './RAGChat.css'

function RAGChat({ regionData }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [ragAvailable, setRagAvailable] = useState(true)

  useEffect(() => {
    if (regionData) {
      loadRecommendations()
    }
  }, [regionData])

  const loadRecommendations = async () => {
    try {
      const result = await ragAPI.getRecommendations(regionData.risk_level)
      setRecommendations(result.recommendations || [])
      setRagAvailable(result.rag_available !== false)
    } catch (error) {
      console.error('Failed to load recommendations:', error)
      setRagAvailable(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question.trim()) return

    setLoading(true)
    setAnswer('')

    try {
      const result = await ragAPI.query(question, 'hybrid')
      setAnswer(result.answer || '답변을 생성할 수 없습니다.')
      setRagAvailable(result.rag_available !== false)
    } catch (error) {
      console.error('Query failed:', error)
      setAnswer('오류가 발생했습니다: ' + error.message)
      setRagAvailable(false)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickQuestion = (q) => {
    setQuestion(q)
  }

  const quickQuestions = [
    `${regionData?.region_name}의 폭염 위험도는 어떤가요?`,
    '폭염 대비 행동 요령을 알려주세요',
    '취약 계층은 어떻게 대응해야 하나요?',
    '폭염 주의보와 경보의 차이는 무엇인가요?'
  ]

  return (
    <div className="rag-chat">
      <div className="chat-header">
        <h2>🤖 AI 폭염 분석 (LightRAG)</h2>
        {!ragAvailable && (
          <span className="rag-status">
            RAG 서비스 비활성화 (OpenAI API 키 필요)
          </span>
        )}
      </div>

      {regionData && (
        <div className="region-summary">
          <h3>{regionData.region_name} 폭염 권장사항</h3>
          {recommendations.length > 0 ? (
            <ul className="recommendations-list">
              {recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          ) : (
            <p className="loading-text">권장사항 로딩 중...</p>
          )}
        </div>
      )}

      <div className="quick-questions">
        <p className="quick-label">빠른 질문:</p>
        <div className="quick-buttons">
          {quickQuestions.map((q, index) => (
            <button
              key={index}
              className="quick-button"
              onClick={() => handleQuickQuestion(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder="폭염 관련 질문을 입력하세요..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="chat-submit"
          disabled={loading || !question.trim()}
        >
          {loading ? '분석중...' : '질문'}
        </button>
      </form>

      {answer && (
        <div className="chat-answer">
          <div className="answer-label">📝 답변:</div>
          <div className="answer-text">{answer}</div>
        </div>
      )}
    </div>
  )
}

export default RAGChat
