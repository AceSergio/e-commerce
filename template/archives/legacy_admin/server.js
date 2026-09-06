const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🛡️ Dashboard Admin démarré avec succès sur http://localhost:${PORT}`);
});
