import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", form);
      setMsg(res.data.msg);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (e) {
      setMsg(e.response?.data?.msg || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <form className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-blue-200" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-extrabold mb-4 text-center text-blue-800">Login</h2>
        {msg && <div className="mb-2 text-center text-blue-700 font-semibold">{msg}</div>}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-blue-400 focus:border-blue-400" required />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-blue-400 focus:border-blue-400" required />
        </div>
        <button className="bg-blue-700 text-white px-4 py-2 rounded w-full hover:bg-blue-900 font-bold transition" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}