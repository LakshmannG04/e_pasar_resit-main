import { useState } from 'react';
import axios from 'axios';
import Endpoint from '@/endpoint';
import Admin_Lay from './layout';
import getToken from '@/tokenmanager';

export default function CreateAdmin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [contactNo, setContactNo] = useState('');


    const handleCreate = async (e: any) => {
        e.preventDefault();
        const token = getToken('token');
    
        try {
          const res = await axios.post(Endpoint.addAdmin, {
            username,
            password,
            firstName,
            lastName,
            email,
            contactNo
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
    
          if (res.data?.status === 200) {
            alert(' Admin created successfully!');
            // reset form
            setUsername('');
            setPassword('');
            setFirstName('');
            setLastName('');
            setEmail('');
            setContactNo('');
          } else {
            alert(res.data?.message || 'Something went wrong.');
          }
    
        } catch (err: any) {
            const rawMsg = err?.response?.data?.message || '';
          
            if (err.response?.status === 409 || rawMsg.includes('UniqueConstraint')) {
              alert(' Username or Email is already in use.');
            } else if (rawMsg.includes('Validation error')) {
              alert(' Validation failed. Please check your input.');
            } else {
              alert(` Failed to create admin: ${rawMsg || 'Unknown error.'}`);
            }
          }          
      };
      

    return (
        <Admin_Lay>
            <div className="max-w-md mx-auto mt-10 bg-white shadow-md rounded-lg p-6 space-y-6">
                <h1 className="text-2xl font-bold text-center">Create New Admin</h1>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-semibold">Username</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                            className="w-full border rounded-md px-3 py-2" required />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full border rounded-md px-3 py-2" required />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">First Name</label>
                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                            className="w-full border rounded-md px-3 py-2" required />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Last Name</label>
                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                            className="w-full border rounded-md px-3 py-2" required />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full border rounded-md px-3 py-2" required />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Contact No</label>
                        <input type="text" value={contactNo} onChange={(e) => setContactNo(e.target.value)}
                            className="w-full border rounded-md px-3 py-2" required />
                    </div>
                    <button type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
                        Create Admin
                    </button>
                </form>
            </div>
        </Admin_Lay>
    );
}
