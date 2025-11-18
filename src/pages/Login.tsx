import { useEffect, useState } from 'react'
import '../style/App.css'
import { digestMessage } from '../shared/crypt'
import { userData } from '../shared/auth'
import { Form, redirect, useActionData, useNavigation } from 'react-router'


Login.action = async ({ request }: { request: Request }) => {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Please fill in all fields' }
  }

  if (!email.includes('@')) {
    return { error: 'Please enter a valid email address' }
  }

  const s = Date.now().toString();
  const d = await digestMessage(s + password);

  try {
    const response = await fetch('https://function-b4.22sao0ofnhw5.br-sao.codeengine.appdomain.cloud/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user: email,
        pass: s + 'H' + d
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Response data:', data)
    // Here you would typically check the response to see if login was successful
    userData.email = email;
    userData.data = data.data;
    localStorage.setItem('lsAbu_CT_userData', JSON.stringify(userData));
    return redirect('/');
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to login' }
  }
}


export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const isLoading = useNavigation().state !== 'idle'
  const [error, setError] = useState<string>('');
  const actionError = useActionData()?.error ?? '';

  useEffect(() => {
    setError(actionError)
  }, [actionError])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  return (
    <>
      <h1>Login</h1>
      <div className="card">
        <Form method='post' className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="login-button"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </Form>
        
        {error && (
          <div className="error">
            <p style={{ color: 'red' }}>Error: {error}</p>
          </div>
        )}
      </div>
      <p className="read-the-docs">
        Enter your credentials to access the application
      </p>
    </>
  )
}