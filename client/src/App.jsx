import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import useUserStore from './store/useUserStore';

const defaultValues = {
  name: '',
  email: '',
  password: '',
  gender: '',
  age: ''
};


const App = () => {
  const { users, fetchUsers, addUser, updateUser, deleteUser, loading, error } = useUserStore();
  const [editId, setEditId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({ defaultValues });

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onSubmit = async (data) => {
    if (editId !== null) {
      await updateUser(editId, data);
      setEditId(null);
    } else {
      await addUser(data);
    }
    reset(defaultValues);
  };

  const handleEdit = (index) => {
    const user = users[index];
    // Map fullName from backend to name for the form
    setValue('name', user.fullName);
    setValue('email', user.email);
    setValue('password', user.password);
    setValue('gender', user.gender);
    setValue('age', user.age);
    setEditId(user.id);
  };

  const handleDelete = (index) => {
    setDeleteId(users[index].id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    await deleteUser(deleteId);
    setShowConfirm(false);
    setDeleteId(null);
    if (editId === deleteId) {
      reset(defaultValues);
      setEditId(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirm(false);
    setDeleteId(null);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f6fa' }}>
      {/* Left: Form */}
      <div style={{ flex: 1, padding: '40px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%', maxWidth: 400, background: '#f9f9f9', padding: 32, borderRadius: 12, boxShadow: '0 2px 8px #0001' }}>
          <h2 style={{ marginBottom: 24 }}>{editId !== null ? 'Edit User' : 'Add User'}</h2>
          {/* Name */}
          <div style={{ marginBottom: 18 }}>
            <input
              placeholder="Name"
              {...register('name', { required: 'Name is required' })}
              style={{
                width: '100%',
                padding: 10,
                border: errors.name ? '2px solid #e74c3c' : '1px solid #ccc',
                borderRadius: 6
              }}
            />
            {errors.name && <div style={{ color: '#e74c3c', fontSize: 13 }}>{errors.name.message}</div>}
          </div>
          {/* Email */}
          <div style={{ marginBottom: 18 }}>
            <input
              placeholder="Email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email address'
                }
              })}
              style={{
                width: '100%',
                padding: 10,
                border: errors.email ? '2px solid #e74c3c' : '1px solid #ccc',
                borderRadius: 6
              }}
            />
            {errors.email && <div style={{ color: '#e74c3c', fontSize: 13 }}>{errors.email.message}</div>}
          </div>
          {/* Password */}
          <div style={{ marginBottom: 18 }}>
            <input
              placeholder="Password"
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
                validate: value =>
                  /[a-z]/.test(value) &&
                  /[A-Z]/.test(value) &&
                  /[0-9]/.test(value) ||
                  'Password must contain upper, lower case letter and number'
              })}
              style={{
                width: '100%',
                padding: 10,
                border: errors.password ? '2px solid #e74c3c' : '1px solid #ccc',
                borderRadius: 6
              }}
            />
            {errors.password && <div style={{ color: '#e74c3c', fontSize: 13 }}>{errors.password.message}</div>}
          </div>
          {/* Gender */}
          <div style={{ marginBottom: 18 }}>
            <select
              {...register('gender', { required: 'Gender is required' })}
              style={{
                width: '100%',
                padding: 10,
                border: errors.gender ? '2px solid #e74c3c' : '1px solid #ccc',
                borderRadius: 6,
                background: '#fff'
              }}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <div style={{ color: '#e74c3c', fontSize: 13 }}>{errors.gender.message}</div>}
          </div>
          {/* Age */}
          <div style={{ marginBottom: 24 }}>
            <input
              placeholder="Age"
              type="number"
              {...register('age', {
                required: 'Age is required',
                min: { value: 1, message: 'Age must be at least 1' }
              })}
              style={{
                width: '100%',
                padding: 10,
                border: errors.age ? '2px solid #e74c3c' : '1px solid #ccc',
                borderRadius: 6
              }}
            />
            {errors.age && <div style={{ color: '#e74c3c', fontSize: 13 }}>{errors.age.message}</div>}
          </div>
          <button type="submit" style={{ width: '100%', padding: 12, background: '#0984e3', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
            {editId !== null ? 'Update' : 'Submit'}
          </button>
          {editId !== null && (
            <button type="button" onClick={() => { reset(defaultValues); setEditId(null); }} style={{ width: '100%', marginTop: 10, padding: 10, background: '#b2bec3', color: '#222', border: 'none', borderRadius: 6, fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>
              Cancel Edit
            </button>
          )}
          {loading && <div style={{ color: '#636e72', marginTop: 10 }}>Loading...</div>}
          {error && <div style={{ color: '#e74c3c', marginTop: 10 }}>{error}</div>}
        </form>
      </div>
      {/* Right: Table */}
      <div style={{ flex: 1, padding: '40px', overflowX: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <table style={{ width: '100%', maxWidth: 600, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', borderCollapse: 'collapse', overflow: 'hidden' }}>
          <thead style={{ background: '#dfe6e9' }}>
            <tr>
              <th style={{ padding: 12 }}>Name</th>
              <th style={{ padding: 12 }}>Email</th>
              <th style={{ padding: 12 }}>Password</th>
              <th style={{ padding: 12 }}>Gender</th>
              <th style={{ padding: 12 }}>Age</th>
              <th style={{ padding: 12 }}>Edit</th>
              <th style={{ padding: 12 }}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#636e72' }}>No users yet.</td></tr>
            ) : (
              users.map((user, idx) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 10 }}>{user.fullName}</td>
                  <td style={{ padding: 10 }}>{user.email}</td>
                  <td style={{ padding: 10 }}>{user.password}</td>
                  <td style={{ padding: 10 }}>{user.gender}</td>
                  <td style={{ padding: 10 }}>{user.age}</td>
                  <td style={{ padding: 10 }}>
                    <button onClick={() => handleEdit(idx)} style={{ background: '#00b894', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 14px', cursor: 'pointer' }}>Edit</button>
                  </td>
                  <td style={{ padding: 10 }}>
                    <button onClick={() => handleDelete(idx)} style={{ background: '#d63031', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 14px', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {/* Confirmation Dialog */}
        {showConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0007', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#fff', padding: 32, borderRadius: 10, minWidth: 300, textAlign: 'center', boxShadow: '0 2px 8px #0002' }}>
              <div style={{ marginBottom: 18, fontSize: 18 }}>Are you sure you want to delete this user?</div>
              <button onClick={confirmDelete} style={{ background: '#d63031', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 20px', marginRight: 10, cursor: 'pointer' }}>Delete</button>
              <button onClick={cancelDelete} style={{ background: '#b2bec3', color: '#222', border: 'none', borderRadius: 4, padding: '8px 20px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;