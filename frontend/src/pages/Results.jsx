import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import { FiArrowLeft, FiFileText, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Results() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => { loadDocuments(); }, [page]);

  const loadDocuments = async () => {
    try {
      const res = await documentsAPI.getAll(page, 10);
      setDocuments(res.data.documents || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      toast.error('Hujjatlarni yuklashda xato');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Hujjatni o'chirmoqchimisiz?")) return;
    try {
      await documentsAPI.delete(id);
      toast.success("Hujjat o'chirildi");
      loadDocuments();
    } catch { toast.error("O'chirishda xato"); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
            <FiArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-primary-700">Natijalar</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner w-10 h-10"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FiFileText className="mx-auto text-gray-300" size={48} />
              <p className="text-gray-500 mt-2">Hujjatlar topilmadi</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-gray-500">Nomi</th>
                      <th className="pb-3 font-medium text-gray-500">Originallik</th>
                      <th className="pb-3 font-medium text-gray-500">AI baho</th>
                      <th className="pb-3 font-medium text-gray-500">Holat</th>
                      <th className="pb-3 font-medium text-gray-500">Sana</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id}
                        className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/documents/${doc.id}`)}
                      >
                        <td className="py-3 font-medium text-gray-900">
                          {doc.title || doc.filename || 'Nomsiz'}
                        </td>
                        <td className="py-3">
                          <span className={`font-semibold ${
                            doc.originality_score >= 70 ? 'text-green-600' :
                            doc.originality_score >= 40 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {doc.originality_score != null ? `${doc.originality_score}%` : '—'}
                          </span>
                        </td>
                        <td className="py-3">
                          {doc.ai_score != null ? `${doc.ai_score}%` : '—'}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            doc.status === 'completed' ? 'bg-green-100 text-green-700' :
                            doc.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {doc.status === 'completed' ? 'Tayyor' :
                             doc.status === 'processing' ? 'Jarayonda' : 'Kutilmoqda'}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString('uz') : '—'}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={(e) => handleDelete(doc.id, e)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > 10 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="btn-secondary text-sm"
                  >Oldingi</button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Sahifa {page}
                  </span>
                  <button
                    disabled={page * 10 >= total}
                    onClick={() => setPage(p => p + 1)}
                    className="btn-secondary text-sm"
                  >Keyingi</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
