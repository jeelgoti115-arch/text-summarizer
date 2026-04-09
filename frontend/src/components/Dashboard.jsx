import React, { useState } from 'react'
import axios from 'axios';
import { jsPDF } from 'jspdf';

const Dashboard = () => {

    const [text, setText] = useState("");
    const [file, setFile] = useState(null);
    const [summary, setSummary] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!text.trim()) {
            setError("Please enter text to summarize.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            const headers = {};
            if (token) headers.Authorization = token;

            const res = await axios.post(
                "http://localhost:5000/api/summarize",
                { text },
                { headers }
            );

            setSummary(res.data.summary);
            setFile(null);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || "Could not generate summary.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (event) => {
        setFile(event.target.files?.[0] || null);
        setError("");
    };

    const handleFileSubmit = async () => {
        if (!file) {
            setError("Please select a PDF file to upload.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            const headers = {};
            if (token) headers.Authorization = token;

            const formData = new FormData();
            formData.append("file", file);

            const res = await axios.post(
                "http://localhost:5000/api/summarize/pdf",
                formData,
                { headers }
            );

            setSummary(res.data.summary);
            setText("");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || "Could not generate summary from PDF.");
        } finally {
            setLoading(false);
        }
    };

    const downloadSummaryPdf = () => {
        if (!summary) return;

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("AI Summary", 14, 20);
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(summary, 180);
        doc.text(lines, 14, 32);
        doc.save("summary.pdf");
    };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
            {/* Header */}
            <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                AI <span className="text-indigo-600">Summarizer</span>
            </h1>
            <p className="text-slate-500 mt-2">Paste your long text below to get a concise summary in seconds.</p>
            </div>
            {/* Input Section */}
            <div className="space-y-4">
            <textarea 
                className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none text-slate-700 placeholder:text-slate-400"
                placeholder="Enter your content here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {loading ? "Summarizing..." : "Summarize Now"}
            </button>
            <div className="pt-4 border-t border-slate-200">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Or upload a PDF</label>
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <button
                    onClick={handleFileSubmit}
                    disabled={loading}
                    className="mt-3 w-full py-3 px-6 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? "Summarizing PDF..." : "Summarize PDF"}
                </button>
            </div>
            </div>
            {error && (
                <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                    {error}
                </div>
            )}
            {/* Result Section */}
            {summary && (
            <div className="mt-8 p-6 bg-indigo-50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2">Summary</h3>
                    </div>
                    <button
                        onClick={downloadSummaryPdf}
                        className="px-4 py-2 bg-white text-indigo-700 border border-indigo-200 rounded-full font-semibold hover:bg-indigo-50 transition-all"
                    >
                        Save as PDF
                    </button>
                </div>
                <p className="text-slate-700 leading-relaxed mt-4">
                {summary}
                </p>
            </div>
            )}
        </div>
    </div>
    )
}

export default Dashboard