import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { documentsAPI } from '../services/api';
import { FiFileText, FiPlusCircle, FiLogOut, FiShield, FiBarChart2 } from 'react-icons/fi';

export default function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await documentsAPI.getAll(1, 5);
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalDocs = documents.length;
  const avgOriginality = totalDocs > 0
    ? Math.round(documents.reduce((sum, d) => sum + (d.originality_score || 0), 0) / totalDocs)
    : 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-700">Antiplagiat</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.full_name || user?.email}</span>
            {isAdmin && (
              <Link to="/admin" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                <FiShield size={14} /> Admin
              </Link>
            )}
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors">
              <FiLogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Bosh sahifa</h2>
          <Link to="/check" className="btn-primary flex items-center gap-2">
            <FiPlusCircle /> Yangi tekshirish
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <FiFileText className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalDocs}</p>
              <p className="text-sm text-gray-500">Jami hujjatlar</p>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiBarChart2 className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{avgOriginality}%</p>
              <p className="text-sm text-gray-500">O'rtacha originallik</p>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiPlusCircle className="text-purple-600" size={24} />
            </div>
            <div>
              <Link to="/check" className="text-primary-600 hover:underline font-medium">
                Yangi tekshirish boshlash
              </Link>
              <p className="text-sm text-gray-500">Matn yoki fayl yuklash</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">So'nggi hujjatlar</h3>
            <Link to="/results" className="text-sm text-primary-600 hover:underline">Barchasini ko'rish</Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="spinner w-8 h-8"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FiFileText className="mx-auto text-gray-300" size={48} />
              <p className="text-gray-500 mt-2">Hali hujjat tekshirilmagan</p>
              <Link to="/check" className="text-primary-600 hover:underline text-sm mt-1 inline-block">
                Birinchi tekshirishni boshlang
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-gray-500">Nomi</th>
                    <th className="pb-3 font-medium text-gray-500">Originallik</th>
                    <th className="pb-3 font-medium text-gray-500">Holat</th>
                    <th className="pb-3 font-medium text-gray-500">Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/documents/${doc.id}`)}>
                      <td className="py-3 font-medium text-gray-900">{doc.title || doc.filename || 'Nomsiz'}</td>
                      <td className="py-3">
                        <span className={`font-semibold ${doc.originality_score >= 70 ? 'text-green-600' : doc.originality_score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {doc.originality_score != null ? `${doc.originality_score}%` : '—'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${doc.status === 'completed' ? 'bg-green-100 text-green-700' : doc.status === 'processing' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                          {doc.status === 'completed' ? 'Tayyor' : doc.status === 'processing' ? 'Jarayonda' : doc.status || 'Kutilmoqda'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">{doc.created_at ? new Date(doc.created_at).toLocaleDateString('uz') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
