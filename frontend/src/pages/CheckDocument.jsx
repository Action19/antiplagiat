import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { documentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiUpload, FiFileText, FiArrowLeft, FiCheck } from 'react-icons/fi';

export default function CheckDocument() {
  const [mode, setMode] = useState('text'); // 'text' or 'file'
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      if (mode === 'text') {
        if (!text.trim()) {
          toast.error('Matn kiriting');
          setLoading(false);
          return;
        }
        response = await documentsAPI.checkText({ text, title: title || 'Nomsiz hujjat' });
      } else {
        if (!file) {
          toast.error('Fayl tanlang');
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append('document', file);
        if (title) formData.append('title', title);
        response = await documentsAPI.upload(formData);
      }

      toast.success('Hujjat tekshirishga yuborildi!');
      const docId = response.data.document?.id || response.data.id;
      if (docId) {
        navigate(`/documents/${docId}`);
      } else {
        navigate('/results');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
            <FiArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-primary-700">Yangi tekshirish</h1>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="card">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('text')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${mode === 'text' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <FiFileText className="inline mr-2" /> Matn kiritish
            </button>
            <button
              onClick={() => setMode('file')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${mode === 'file' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <FiUpload className="inline mr-2" /> Fayl yuklash
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hujjat nomi (ixtiyoriy)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Masalan: Kurs ishi, Referat..."
              />
            </div>

            {mode === 'text' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matn</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="input-field min-h-[300px] resize-y"
                  placeholder="Tekshirilishi kerak bo'lgan matnni shu yerga kiriting..."
                />
                <p className="text-xs text-gray-500 mt-1">{text.length} ta belgi</p>
              </div>
            ) : (
              <div>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-500 bg-primary-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-primary-400'}`}
                >
                  <input {...getInputProps()} />
                  {file ? (
                    <div>
                      <FiCheck className="mx-auto text-green-500 mb-2" size={40} />
                      <p className="font-medium text-green-700">{file.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                      <p className="text-xs text-gray-400 mt-2">Boshqa fayl tanlash uchun bosing</p>
                    </div>
                  ) : (
                    <div>
                      <FiUpload className="mx-auto text-gray-400 mb-2" size={40} />
                      <p className="font-medium text-gray-700">Faylni shu yerga tashlang yoki bosing</p>
                      <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX, TXT (max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <><div className="spinner w-5 h-5"></div> Tekshirilmoqda...</>
              ) : (
                <><FiCheck /> Tekshirishni boshlash</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
