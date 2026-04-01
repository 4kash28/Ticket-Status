import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Plus, CheckCircle2, Trash2, Search, LogOut, X, Edit2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export interface Ticket {
  id: string;
  user_name: string;
  issue_description: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [userName, setUserName] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editUserName, setEditUserName] = useState("");
  const [editIssueDescription, setEditIssueDescription] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      const { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
      if (data) setTickets(data);
    };

    fetchTickets();

    const channel = supabase
      .channel('public:tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchTickets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !issueDescription.trim()) return;

    await supabase.from('tickets').insert([{
      user_name: userName.trim(),
      issue_description: issueDescription.trim(),
    }]);

    setUserName("");
    setIssueDescription("");
  };

  const handleResolveTicket = async (id: string) => {
    await supabase.from('tickets').delete().eq('id', id);
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsEditing(false);
    setEditUserName(ticket.user_name);
    setEditIssueDescription(ticket.issue_description);
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !editUserName.trim() || !editIssueDescription.trim()) return;

    await supabase.from('tickets').update({
      user_name: editUserName.trim(),
      issue_description: editIssueDescription.trim(),
    }).eq('id', selectedTicket.id);

    // Update local state for immediate feedback
    setTickets(tickets.map(t => t.id === selectedTicket.id ? {
      ...t,
      user_name: editUserName.trim(),
      issue_description: editIssueDescription.trim(),
    } : t));

    setSelectedTicket({
      ...selectedTicket,
      user_name: editUserName.trim(),
      issue_description: editIssueDescription.trim(),
    });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const filteredTickets = tickets.filter(
    (t) =>
      t.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.issue_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Missing Ticket Portal
            </h1>
            <p className="text-gray-500 mt-2">
              Specifically designed to track and log tasks that were completed without a corresponding ticket.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </header>

        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-800">Purpose of this portal</h3>
            <p className="text-sm text-amber-700 mt-1">
              This system is strictly for recording work that has already been done but wasn't logged in the main ticketing system. Please ensure all details are accurate for proper tracking.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Ticket Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-10">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Log Missing Ticket
              </h2>
              <form onSubmit={handleAddTicket} className="space-y-5">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                    Team Member Name
                  </label>
                  <input
                    type="text"
                    id="userName"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Who completed the task?"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-1">
                    Completed Task Description
                  </label>
                  <textarea
                    id="issue"
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                    placeholder="Describe what was completed..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={!userName.trim() || !issueDescription.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Log Ticket
                </button>
              </form>
            </div>
          </div>

          {/* Ticket List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  Unlogged Tasks
                  <span className="bg-blue-100 text-blue-700 py-0.5 px-2.5 rounded-full text-xs font-bold">
                    {tickets.length}
                  </span>
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {filteredTickets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {tickets.length === 0 ? "All caught up! No missing tickets reported." : "No tasks match your search."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => handleTicketClick(ticket)}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col relative group cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 shrink-0">
                            {ticket.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate pr-2">
                              {ticket.user_name}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono">
                              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleResolveTicket(ticket.id); }}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1 mb-4">
                        <p className="text-sm text-gray-700 break-words leading-relaxed">
                          {ticket.issue_description}
                        </p>
                      </div>
                      <div className="mt-auto pt-4 border-t border-gray-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleResolveTicket(ticket.id); }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Ticket Raised
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-semibold text-gray-900">Ticket Details</h2>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Ticket"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {isEditing ? (
                <form id="edit-ticket-form" onSubmit={handleUpdateTicket} className="space-y-5">
                  <div>
                    <label htmlFor="editUserName" className="block text-sm font-medium text-gray-700 mb-1">
                      Team Member Name
                    </label>
                    <input
                      type="text"
                      id="editUserName"
                      value={editUserName}
                      onChange={(e) => setEditUserName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="editIssue" className="block text-sm font-medium text-gray-700 mb-1">
                      Completed Task Description
                    </label>
                    <textarea
                      id="editIssue"
                      value={editIssueDescription}
                      onChange={(e) => setEditIssueDescription(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                      required
                    />
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Team Member</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 shrink-0">
                        {selectedTicket.user_name.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-gray-900 font-medium">{selectedTicket.user_name}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Logged At</h3>
                    <p className="text-gray-900">
                      {new Date(selectedTicket.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Completed Task Description</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {selectedTicket.issue_description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditUserName(selectedTicket.user_name);
                      setEditIssueDescription(selectedTicket.issue_description);
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="edit-ticket-form"
                    disabled={!editUserName.trim() || !editIssueDescription.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handleResolveTicket(selectedTicket.id);
                    setSelectedTicket(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Ticket Raised
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
