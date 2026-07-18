import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { FiArrowLeft, FiUsers, FiFileText, FiBarChart2, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'stats') {
        const res = await adminAPI.getStats();
        setStats(res.data);
      } else if (tab === 'users') {
        const res = await adminAPI.getUsers();
        setUsers(res.data.users || res.data || []);
      } else if (tab === 'documents') {
        const res = await adminAPI.getDocuments();
        setDocuments(res.data.documents || res.data || []);
      }
    } catch (error) {
      toast.error("Ma'lumotlarni yuklashda xato");
    } finally { setLoading(false); }
  };

  const handleToggleUser = async (id) => {
    try {
      await adminAPI.toggleUser(id);
      toast.success("Foydalanuvchi holati o'zgartirildi");
      loadData();
    } catch { toast.error('Xato yuz berdi'); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Foydalanuvchini o'chirmoqchimisiz?")) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success("Foydalanuvchi o'chirildi");
      loadData();
    } catch { toast.error("O'chirishda xato"); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
            <FiArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-primary-700">Admin Panel</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'stats', icon: FiBarChart2, label: 'Statistika' },
            { key: 'users', icon: FiUsers, label: 'Foydalanuvchilar' },
            { key: 'documents', icon: FiFileText, label: 'Hujjatlar' }
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                tab === key ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner w-10 h-10"></div>
          </div>
        ) : (
          <>
            {/* Stats Tab */}
            {tab === 'stats' && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card">
                  <p className="text-sm text-gray-500">Jami foydalanuvchilar</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers || 0}</p>
                </div>
                <div className="card">
                  <p className="text-sm text-gray-500">Jami hujjatlar</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalDocuments || 0}</p>
                </div>
                <div className="card">
                  <p className="text-sm text-gray-500">Bugungi tekshiruvlar</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.todayChecks || 0}</p>
                </div>
                <div className="card">
                  <p className="text-sm text-gray-500">O'rtacha originallik</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.avgOriginality || 0}%</p>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {tab === 'users' && (
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-gray-500">Ism</th>
                      <th className="pb-3 font-medium text-gray-500">Email</th>
                      <th className="pb-3 font-medium text-gray-500">Rol</th>
                      <th className="pb-3 font-medium text-gray-500">Holat</th>
                      <th className="pb-3 font-medium text-gray-500">Ro'yxatdan</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{u.full_name || '—'}</td>
                        <td className="py-3 text-gray-600">{u.email}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                          }`}>{u.role}</span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>{u.is_active !== false ? 'Faol' : 'Bloklangan'}</span>
                        </td>
                        <td className="py-3 text-gray-500">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('uz') : '—'}
                        </td>
                        <td className="py-3 flex gap-2">
                          <button onClick={() => handleToggleUser(u.id)} className="text-gray-500 hover:text-primary-600">
                            {u.is_active !== false ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                          </button>
                          <button onClick={() => handleDeleteUser(u.id)} className="text-gray-400 hover:text-red-500">
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p className="text-center py-8 text-gray-500">Foydalanuvchilar topilmadi</p>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {tab === 'documents' && (
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-gray-500">Hujjat</th>
                      <th className="pb-3 font-medium text-gray-500">Foydalanuvchi</th>
                      <th className="pb-3 font-medium text-gray-500">Originallik</th>
                      <th className="pb-3 font-medium text-gray-500">Holat</th>
                      <th className="pb-3 font-medium text-gray-500">Sana</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{doc.title || doc.filename || 'Nomsiz'}</td>
                        <td className="py-3 text-gray-600">{doc.user_email || doc.user?.email || '—'}</td>
                        <td className="py-3">
                          <span className={`font-semibold ${
                            doc.originality_score >= 70 ? 'text-green-600' :
                            doc.originality_score >= 40 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {doc.originality_score != null ? `${doc.originality_score}%` : '—'}
                          </span>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
                {documents.length === 0 && (
                  <p className="text-center py-8 text-gray-500">Hujjatlar topilmadi</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
