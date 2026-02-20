import React, { useState, useEffect } from 'react';

// Mock API function - replace with your actual API client
const api = {
  get: async (url, token) => {
    // In a real app, this would be a fetch call with headers
    // For this example, we'll return mock data.
    if (url === '/api/wallets') {
      return [
        { id: 'w1', name: 'Main Treasury', chain: 'Ethereum', balance: 145.20, status: 'valid', address: '0x71C...9A21' },
        { id: 'w2', name: 'Polygon Exec', chain: 'Polygon', balance: 4500.50, status: 'valid', address: '0x82a...bB32' },
      ];
    }
    return [];
  },
  post: async (url, data, token) => {
    console.log('Posting to', url, data);
    return { status: 'success', wallet: { ...data, id: Date.now().toString(), status: 'valid' } };
  }
};

const WalletManagement = () => {
  const [wallets, setWallets] = useState([]);
  const [newWallet, setNewWallet] = useState({ name: '', address: '', chain: 'Ethereum' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const authToken = 'your-jwt-token'; // Replace with actual token management

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        setIsLoading(true);
        const data = await api.get('/api/wallets', authToken);
        setWallets(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch wallets.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWallets();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewWallet(prev => ({ ...prev, [name]: value }));
  };

  const handleAddWallet = async (e) => {
    e.preventDefault();
    if (!newWallet.name || !newWallet.address) {
      alert('Please fill in all fields.');
      return;
    }
    try {
      const response = await api.post('/api/wallets', newWallet, authToken);
      if (response.status === 'success') {
        setWallets(prev => [...prev, response.wallet]);
        setNewWallet({ name: '', address: '', chain: 'Ethereum' }); // Reset form
      }
    } catch (err) {
      setError('Failed to add wallet.');
    }
  };

  const totalBalance = wallets.reduce((acc, wallet) => acc + (wallet.balance || 0), 0);

  if (isLoading) return <div>Loading wallets...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="wallet-management-container">
      <h2>Wallet Management</h2>
      
      {/* Add Wallet Form */}
      <form onSubmit={handleAddWallet}>
        <input type="text" name="name" value={newWallet.name} onChange={handleInputChange} placeholder="Wallet Name" />
        <input type="text" name="address" value={newWallet.address} onChange={handleInputChange} placeholder="Wallet Address" />
        <select name="chain" value={newWallet.chain} onChange={handleInputChange}>
          <option value="Ethereum">Ethereum</option>
          <option value="Polygon">Polygon</option>
          <option value="Arbitrum">Arbitrum</option>
        </select>
        <button type="submit">Add Wallet</button>
      </form>

      {/* Wallets Table */}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Chain</th>
            <th>Address</th>
            <th>Balance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {wallets.map(wallet => (
            <tr key={wallet.id}>
              <td>{wallet.name}</td>
              <td>{wallet.chain}</td>
              <td>{wallet.address}</td>
              <td>{wallet.balance.toFixed(2)}</td>
              <td>{wallet.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Total Balance: ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
    </div>
  );
};

export default WalletManagement;