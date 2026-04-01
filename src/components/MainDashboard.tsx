import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Clock, AlertCircle, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AnalogClock from "./AnalogClock";
import { supabase } from "../lib/supabase";

export interface Ticket {
  id: string;
  user_name: string;
  issue_description: string;
  created_at: string;
}

export default function MainDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUserIndex, setCurrentUserIndex] = useState(0);

  useEffect(() => {
    const fetchTickets = async () => {
      const { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: true });
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const rotateTimer = setInterval(() => {
      setCurrentUserIndex((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(rotateTimer);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Group tickets by user
  const ticketsByUser = tickets.reduce((acc, ticket) => {
    if (!acc[ticket.user_name]) {
      acc[ticket.user_name] = [];
    }
    acc[ticket.user_name].push(ticket);
    return acc;
  }, {} as Record<string, Ticket[]>);

  // Sort users by number of pending tickets (descending)
  const sortedUsers = Object.keys(ticketsByUser).sort(
    (a, b) => ticketsByUser[b].length - ticketsByUser[a].length
  );

  const activeUser = sortedUsers.length > 0 ? sortedUsers[currentUserIndex % sortedUsers.length] : null;
  const activeUserTickets = activeUser ? ticketsByUser[activeUser] : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    },
    exit: {
      opacity: 0,
      transition: { staggerChildren: 0.05 }
    }
  };

  const ticketVariants = {
    hidden: { opacity: 0, y: 60, rotateX: -80 },
    show: { opacity: 1, y: 0, rotateX: 0, transition: { type: "spring", stiffness: 150, damping: 15 } },
    exit: { opacity: 0, y: -60, rotateX: 80, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
            <AlertCircle className="w-10 h-10 text-red-500" />
            Pending Tickets from users
          </h1>
          <p className="text-white/50 mt-2 text-lg">
            Users with unresolved issues requiring action
          </p>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={handleLogout}
            className="p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors mr-4"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <div className="text-right">
            <div className="text-2xl font-mono font-light tracking-wider">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-white/50 text-sm uppercase tracking-widest mt-1">
              {currentTime.toLocaleDateString()}
            </div>
          </div>
          <AnalogClock time={currentTime} />
        </div>
      </header>

      {tickets.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="flex flex-col items-center justify-center h-[60vh] text-white/30"
        >
          <div className="w-24 h-24 rounded-full border-2 border-white/10 flex items-center justify-center mb-6">
            <Clock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-light tracking-widest uppercase">No Pending Tickets</h2>
          <p className="mt-2 text-sm">All systems operational</p>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto mt-10">
          <AnimatePresence mode="wait">
            {activeUser && (
              <motion.div
                key={activeUser}
                initial={{ opacity: 0, y: 120 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -120 }}
                transition={{ duration: 0.7, type: "spring", stiffness: 150, damping: 20 }}
                className="w-full bg-[#141414] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col"
              >
                <div className="bg-[#1a1a1a] p-6 border-b border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-full">
                      <User className="w-8 h-8 text-white/70" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-semibold truncate">{activeUser}</h2>
                      <p className="text-white/40 text-sm mt-1">Pending Action Required</p>
                    </div>
                  </div>
                  <div className="bg-red-500/20 text-red-400 px-5 py-2 rounded-full text-xl font-bold flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                    {activeUserTickets.length} {activeUserTickets.length === 1 ? 'Ticket' : 'Tickets'}
                  </div>
                </div>
                
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  style={{ perspective: 1200 }}
                  className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto max-h-[500px] overflow-x-hidden"
                >
                  <AnimatePresence mode="popLayout">
                    {activeUserTickets.map((ticket) => (
                      <motion.div 
                        layout
                        variants={ticketVariants}
                        key={ticket.id} 
                        className="bg-white/5 rounded-xl p-5 border border-white/5 origin-top"
                      >
                        <p className="text-white/90 text-lg leading-relaxed">
                          {ticket.issue_description}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-white/40 text-sm font-mono">
                          <Clock className="w-4 h-4" />
                          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Pagination Dots */}
          <div className="flex gap-3 mt-10">
            {sortedUsers.map((user, idx) => (
              <div 
                key={user}
                className={`h-2 rounded-full transition-all duration-500 ${
                  idx === (currentUserIndex % sortedUsers.length) 
                    ? "w-10 bg-blue-500" 
                    : "w-3 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
