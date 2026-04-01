export default function AnalogClock({ time }: { time: Date }) {
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  const secondDegrees = seconds * 6;
  const minuteDegrees = minutes * 6 + seconds * 0.1;
  const hourDegrees = (hours % 12) * 30 + minutes * 0.5;

  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-2xl">
      {/* Clock Face */}
      <circle cx="50" cy="50" r="46" className="fill-[#141414] stroke-white/20 stroke-[4]" />
      
      {/* Tick Marks */}
      {[...Array(12)].map((_, i) => (
        <line 
          key={i}
          x1="50" y1="8" x2="50" y2={i % 3 === 0 ? "14" : "11"} 
          className={`stroke-white/${i % 3 === 0 ? '50' : '20'} stroke-[2]`}
          style={{ transform: `rotate(${i * 30}deg)`, transformOrigin: '50px 50px' }}
        />
      ))}

      {/* Hour Hand */}
      <line x1="50" y1="50" x2="50" y2="26" 
            className="stroke-white stroke-[4]" strokeLinecap="round"
            style={{ transform: `rotate(${hourDegrees}deg)`, transformOrigin: '50px 50px' }} />
      
      {/* Minute Hand */}
      <line x1="50" y1="50" x2="50" y2="16" 
            className="stroke-white/80 stroke-[3]" strokeLinecap="round"
            style={{ transform: `rotate(${minuteDegrees}deg)`, transformOrigin: '50px 50px' }} />
      
      {/* Second Hand */}
      <line x1="50" y1="50" x2="50" y2="12" 
            className="stroke-red-500 stroke-[2]" strokeLinecap="round"
            style={{ transform: `rotate(${secondDegrees}deg)`, transformOrigin: '50px 50px' }} />
      
      {/* Center Dot */}
      <circle cx="50" cy="50" r="3" className="fill-red-500" />
    </svg>
  );
}
