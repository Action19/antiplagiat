import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { aiDetectAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiUpload, FiFileText, FiCpu, FiAlertTriangle, FiCheckCircle, FiX } from 'react-icons/fi';

export default function AIDetector() {
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      let response;
      if (mode === 'file' && file) {
        const formData = new FormData();
        formData.append('file', file);
        response = await aiDetectAPI.checkFile(formData);
      } else if (mode === 'text' && text.trim().length >= 50) {
        response = await aiDetectAPI.checkText(text);
      } else {
        toast.error(mode === 'text' ? 'Kamida 50 ta belgi kiriting' : 'Fayl tanlang');
        setLoading(false);
        return;
      }
      setResult(response.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-red-600';
    if (score >= 55) return 'text-orange-500';
    if (score >= 35) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getScoreBgRing = (score) => {
    if (score >= 75) return '#ef4444';
    if (score >= 55) return '#f97316';
    if (score >= 35) return '#eab308';
    return '#22c55e';
  };

  const renderHighlightedText = () => {
    if (!result || !result.highlights) return null;

    const parts = [];
    let lastIndex = 0;
    const originalText = result.originalText || '';

    for (const h of result.highlights) {
      // Oldin kelgan oddiy matn
      if (h.start > lastIndex) {
        parts.push(
          <span key={`normal-${lastIndex}`}>{originalText.slice(lastIndex, h.start)}</span>
        );
      }

      // Highlighted qism
      let bgClass = '';
      if (h.level === 'high') bgClass = 'bg-red-200 border-b-2 border-red-500';
      else if (h.level === 'medium') bgClass = 'bg-orange-100 border-b-2 border-orange-400';
      else if (h.level === 'low') bgClass = 'bg-yellow-50 border-b border-yellow-300';

      if (h.isAI) {
        parts.push(
          <span
            key={`ai-${h.start}`}
            className={`${bgClass} rounded px-0.5 relative group cursor-help`}
            title={`AI ehtimolligi: ${h.score}%`}
          >
            {originalText.slice(h.start, h.end)}
            <span className="hidden group-hover:block absolute bottom-full left-0 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
              AI: {h.score}%
            </span>
          </span>
        );
      } else {
        parts.push(
          <span key={`human-${h.start}`}>{originalText.slice(h.start, h.end)}</span>
        );
      }

      lastIndex = h.end;
    }

    // Oxirgi qism
    if (lastIndex < originalText.length) {
      parts.push(<span key={`end-${lastIndex}`}>{originalText.slice(lastIndex)}</span>);
    }

    return parts;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <FiCpu className="text-purple-600" size={24} />
          <h1 className="text-xl font-bold text-gray-900">AI Detektor</h1>
          <span className="text-sm text-gray-500 ml-2">Matnning AI tomonidan yozilganligini aniqlash</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Input Section */}
        {!result && (
          <>
          {/* AI Detection Tizimi Info Block */}
          <div className="card mb-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-purple-800">AI DETECTION TIZIMI</h3>
              <p className="text-sm text-purple-600">Yangilangan</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1-daraja */}
              <div className="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm">1</span>
                  <h4 className="font-semibold text-gray-900">Stilometrik tahlil <span className="text-purple-600 text-xs font-normal">(50%)</span></h4>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 ml-9">
                  <li className="flex items-start gap-1"><span className="text-purple-500 mt-0.5">&#8226;</span> 10 ta mezon (patternlar, uzunlik, formal...)</li>
                  <li className="flex items-start gap-1"><span className="text-green-500 mt-0.5">&#8226;</span> Har doim ishlaydi (bepul)</li>
                  <li className="flex items-start gap-1"><span className="text-blue-500 mt-0.5">&#8226;</span> Aniqlik: ~65-70%</li>
                </ul>
              </div>

              {/* 2-daraja */}
              <div className="bg-white rounded-lg p-4 border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">2</span>
                  <h4 className="font-semibold text-gray-900">GPT-2 Perplexity <span className="text-indigo-600 text-xs font-normal">(50%)</span></h4>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 ml-9">
                  <li className="flex items-start gap-1"><span className="text-purple-500 mt-0.5">&#8226;</span> HuggingFace API orqali</li>
                  <li className="flex items-start gap-1"><span className="text-green-500 mt-0.5">&#8226;</span> Matn "bashorat qilinarli" mi tekshiradi</li>
                  <li className="flex items-start gap-1"><span className="text-blue-500 mt-0.5">&#8226;</span> Aniqlik: ~85%</li>
                  <li className="flex items-start gap-1"><span className="text-orange-500 mt-0.5">&#8226;</span> HUGGINGFACE_API_KEY kerak</li>
                </ul>
              </div>
            </div>

            {/* Umumiy */}
            <div className="mt-4 text-center p-3 bg-white rounded-lg border border-green-200">
              <p className="text-sm font-medium text-gray-700">
                Umumiy aniqlik: <span className="text-green-600 font-bold text-lg">~85%</span> <span className="text-gray-500">(ikkalasi birgalikda)</span>
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Matn yoki fayl yuklang</h2>

            {/* Mode tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMode('text')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${mode === 'text' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <FiFileText className="inline mr-2" /> Matn kiritish
              </button>
              <button
                onClick={() => setMode('file')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${mode === 'file' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <FiUpload className="inline mr-2" /> Fayl yuklash
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'text' ? (
                <div>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="input-field min-h-[250px] resize-y font-mono text-sm"
                    placeholder="AI tomonidan yozilganligini tekshirmoqchi bo'lgan matnni shu yerga kiriting...&#10;&#10;Kamida 50 ta belgi bo'lishi kerak."
                  />
                  <p className="text-xs text-gray-500 mt-1">{text.length} belgi | {text.split(/\s+/).filter(w=>w).length} so'z</p>
                </div>
              ) : (
                <div>
                  {!file ? (
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'}`}
                    >
                      <input {...getInputProps()} />
                      <FiUpload className="mx-auto text-gray-400 mb-3" size={36} />
                      <p className="font-medium text-gray-700">Faylni tortib tashlang yoki bosing</p>
                      <p className="text-sm text-gray-400 mt-1">PDF, DOCX, TXT (max 10MB)</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-3">
                        <FiFileText className="text-purple-600" size={20} />
                        <div>
                          <p className="font-medium text-purple-800">{file.name}</p>
                          <p className="text-xs text-purple-600">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setFile(null)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <FiX />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (mode === 'text' && text.length < 50) || (mode === 'file' && !file)}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="spinner w-5 h-5 border-2 border-white/30 border-t-white"></div> Tahlil qilinmoqda...</>
                ) : (
                  <><FiCpu /> AI Tahlilni boshlash</>
                )}
              </button>
            </form>
          </div>
          </>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Tahlil natijalari</h2>
              <button
                onClick={() => { setResult(null); setText(''); setFile(null); }}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Yangi tahlil
              </button>
            </div>

            {/* Score cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* AI Score Circle */}
              <div className="card flex flex-col items-center py-8">
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={getScoreBgRing(result.aiScore)}
                      strokeWidth="10"
                      strokeDasharray={`${result.aiScore * 3.14} ${314 - result.aiScore * 3.14}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-3xl font-bold ${getScoreColor(result.aiScore)}`}>{Math.round(result.aiScore)}%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600 mt-3">AI ehtimolligi</p>
                <p className={`text-xs mt-1 px-3 py-1 rounded-full font-medium ${
                  result.verdict === 'ai_generated' ? 'bg-red-100 text-red-700' :
                  result.verdict === 'likely_ai' ? 'bg-orange-100 text-orange-700' :
                  result.verdict === 'mixed' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {result.message}
                </p>
              </div>

              {/* Statistics */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">Statistika</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jami jumlalar:</span>
                    <span className="font-medium">{result.stats?.totalSentences || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">AI jumlalar:</span>
                    <span className="font-medium text-red-600">{result.stats?.aiSentences || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inson jumlalari:</span>
                    <span className="font-medium text-green-600">{result.stats?.humanSentences || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">AI foizi:</span>
                    <span className="font-bold text-red-600">{result.stats?.aiPercentage || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">So'zlar:</span>
                    <span className="font-medium">{result.stats?.totalWords || 0}</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">Ranglar izohi</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-4 bg-red-200 border border-red-400 rounded"></span>
                    <span className="text-sm text-gray-700">AI yozgan (75%+)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-4 bg-orange-100 border border-orange-300 rounded"></span>
                    <span className="text-sm text-gray-700">Ehtimol AI (55-74%)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-4 bg-yellow-50 border border-yellow-200 rounded"></span>
                    <span className="text-sm text-gray-700">Noaniq (35-54%)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-4 bg-white border border-gray-200 rounded"></span>
                    <span className="text-sm text-gray-700">Inson yozgan (0-34%)</span>
                  </div>
                </div>
                {result.fileName && (
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-xs text-gray-500">Fayl: {result.fileName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Highlighted text */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Matn tahlili</h3>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><FiAlertTriangle className="text-red-500" /> AI qismlar qizilda</span>
                  <span className="flex items-center gap-1"><FiCheckCircle className="text-green-500" /> Inson qismlari oddiy</span>
                </div>
              </div>
              <div className="prose max-w-none text-sm leading-relaxed whitespace-pre-wrap border rounded-lg p-4 bg-gray-50 max-h-[600px] overflow-y-auto">
                {renderHighlightedText()}
              </div>
            </div>

            {/* Sentence list */}
            {result.sentences && result.sentences.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">Jumlalar bo'yicha batafsil</h3>
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {result.sentences.map((s, i) => (
                    <div key={i} className={`p-3 rounded-lg border text-sm ${
                      s.isAI ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">#{i + 1}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          s.isAI ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {s.isAI ? 'AI' : 'Inson'} — {s.aiScore}%
                        </span>
                      </div>
                      <p className="text-gray-800 text-xs leading-relaxed">{s.text.substring(0, 150)}{s.text.length > 150 ? '...' : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
