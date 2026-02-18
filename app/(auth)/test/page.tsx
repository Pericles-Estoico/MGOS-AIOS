export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>✅ Teste Page</h1>
      <p>Se você ver isso, o app básico está funcionando!</p>

      <div style={{
        border: '1px solid green',
        padding: '10px',
        marginTop: '20px',
        backgroundColor: '#f0f0f0'
      }}>
        <h2>Debug Info</h2>
        <p>Se esta página carrega sem looping, o problema está em outro lugar.</p>
        <p>Node Env: {process.env.NODE_ENV}</p>
      </div>

      <a href="/login" style={{
        display: 'block',
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: 'blue',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '5px',
        width: 'fit-content'
      }}>
        Voltar para Login
      </a>
    </div>
  );
}
