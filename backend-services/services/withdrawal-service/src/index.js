const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Simple withdrawal endpoint
app.post('/withdraw', (req, res) => {
  const { amount, address } = req.body;
  // Mock withdrawal
  console.log(`Withdrawing ${amount} to ${address}`);
  res.json({ success: true, txHash: `0x${Math.random().toString(16).substr(2, 64)}` });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Withdrawal Service listening on port ${PORT}`);
});
