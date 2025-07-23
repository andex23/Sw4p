import React, { useState, useEffect, useCallback } from 'react';
import '../AdminStyles.css';

interface DepositIntent {
  id: string;
  userId: string;
  currency: string;
  network: string;
  address: string;
  memo?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

const DepositApproval: React.FC = () => {
  const [deposits, setDeposits] = useState<DepositIntent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  // Demo admin token - in production, this would come from authentication  
  const adminToken = localStorage.getItem('adminToken') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi1kZW1vIiwiZW1haWwiOiJhZG1pbkBkZW1vLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MTM5NTQyMywiZXhwIjoxNzUxNDgxODIzfQ.lJZXyJu_L5Nmrj65gNFDesF8vrsZdtbQ3Xj1P-yTbko';

  const fetchDeposits = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const statusParam = filter === 'ALL' ? '' : `?status=${filter}`;
      const response = await fetch(`/api/admin/deposits${statusParam}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<{ deposits: DepositIntent[] }> = await response.json();
      
      if (result.success && result.data) {
        setDeposits(result.data.deposits);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch deposits');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching deposits:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, adminToken]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result: ApiResponse<{ deposits: typeof stats }> = await response.json();
        if (result.success && result.data) {
          setStats(result.data.deposits);
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchDeposits();
    fetchStats();
  }, [fetchDeposits, fetchStats]);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/deposits/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result: ApiResponse<DepositIntent> = await response.json();
      
      if (result.success) {
        setDeposits(deposits.map(deposit => 
          deposit.id === id ? { ...deposit, status: 'APPROVED' } : deposit
        ));
        fetchStats(); // Refresh stats
        showNotification('Deposit approved successfully', 'success');
      } else {
        throw new Error(result.error?.message || 'Failed to approve deposit');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/deposits/${id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      const result: ApiResponse<DepositIntent> = await response.json();
      
      if (result.success) {
        setDeposits(deposits.map(deposit => 
          deposit.id === id ? { ...deposit, status: 'REJECTED' } : deposit
        ));
        fetchStats(); // Refresh stats
        showNotification('Deposit rejected', 'success');
      } else {
        throw new Error(result.error?.message || 'Failed to reject deposit');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Simple notification system - in production, use a proper toast library
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
    `;
    document.body.appendChild(notification);
    setTimeout(() => document.body.removeChild(notification), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'APPROVED': return '#10b981';
      case 'REJECTED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>💰 Deposit Approval Dashboard</h1>
        <p>Manage deposit intents requiring admin approval</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(status => (
          <button
            key={status}
            className={`filter-tab ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Loading State */}
      {loading && <div className="loading">Loading deposits...</div>}

      {/* Deposits Table */}
      <div className="deposits-table">
        {deposits.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No deposits found for the selected filter.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Currency</th>
                <th>Network</th>
                <th>Address</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map(deposit => (
                <tr key={deposit.id}>
                  <td className="id-cell">{deposit.id.substring(0, 8)}...</td>
                  <td>{deposit.userId.substring(0, 8)}...</td>
                  <td>
                    <span className="currency-badge">{deposit.currency}</span>
                  </td>
                  <td>{deposit.network}</td>
                  <td className="address-cell">
                    {deposit.address.substring(0, 10)}...
                    {deposit.memo && <div className="memo">Memo: {deposit.memo}</div>}
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(deposit.status) }}
                    >
                      {deposit.status}
                    </span>
                  </td>
                  <td className="date-cell">{formatDate(deposit.createdAt)}</td>
                  <td className="actions-cell">
                    {deposit.status === 'PENDING' && (
                      <div className="action-buttons">
                        <button 
                          className="approve-btn"
                          onClick={() => handleApprove(deposit.id)}
                        >
                          ✅ Approve
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => handleReject(deposit.id)}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="refresh-section">
        <button className="refresh-btn" onClick={fetchDeposits}>
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

export default DepositApproval; 