import React from 'react';

export default function HistoryChart({ history = [], goal = 2000 }) {
  // Pad history to ensure 7 days are always represented
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  // Generate mock/real data for last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const dayName = daysOfWeek[d.getDay()];
    
    // Get YYYY-MM-DD in local timezone
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    const dateStr = localDate.toISOString().split('T')[0];
    
    // Find matching entry in our history logs
    const historyEntry = history.find(entry => entry.date === dateStr);
    const amount = historyEntry ? historyEntry.amount : 0;
    const isCompleted = amount >= goal;
    const heightPercent = Math.min((amount / goal) * 100, 100);

    return {
      day: dayName,
      date: dateStr,
      amount,
      isCompleted,
      heightPercent
    };
  });

  // Calculate stats
  const totalHydrated = last7Days.reduce((sum, d) => sum + d.amount, 0);
  const averageIntake = Math.round(totalHydrated / 7);
  
  // Calculate current streak
  let streak = 0;
  // Read history backward starting from today
  for (let i = 6; i >= 0; i--) {
    if (last7Days[i].isCompleted) {
      streak++;
    } else if (i === 6) {
      // If today is not completed, we check if yesterday was. If neither, streak is 0.
      continue;
    } else {
      break;
    }
  }

  return (
    <div className="view-container">
      {/* Stats Summary Grid */}
      <div className="stats-grid">
        <div className="stat-box">
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            Daily Average
          </span>
          <span className="stat-num" style={{ color: 'var(--color-primary)' }}>
            {averageIntake} ml
          </span>
        </div>
        <div className="stat-box">
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            Active Streak
          </span>
          <span className="stat-num" style={{ color: 'var(--color-secondary)' }}>
            {streak} {streak === 1 ? 'Day' : 'Days'} 🐾
          </span>
        </div>
      </div>

      {/* Glassmorphic Chart */}
      <div className="glass-panel">
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '18px', margin: '0 0 5px 0' }}>
          Weekly Hydration
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '15px' }}>
          Daily target: {goal}ml
        </p>

        {/* Vertical Chart Columns */}
        <div className="chart-bar-container">
          {last7Days.map((dayData, index) => (
            <div className="chart-bar-wrapper" key={index}>
              {/* Value pop on top of bar */}
              <span className="chart-bar-val">
                {dayData.amount > 0 ? `${Math.round(dayData.amount / 100) * 100}` : '0'}
              </span>

              {/* Glowing vertical bar */}
              <div 
                className={`chart-bar ${dayData.isCompleted ? 'filled' : ''}`}
                style={{ height: `${Math.max(dayData.heightPercent, 8)}%` }} // Minimum height to show bar base
              >
                {/* Cute paw print overlay inside goal-completed days */}
                {dayData.isCompleted && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '8px',
                      pointerEvents: 'none'
                    }}
                  >
                    🐾
                  </span>
                )}
              </div>

              {/* Day Label */}
              <span className="chart-day" style={{ color: dayData.isCompleted ? '#fff' : 'var(--text-muted)' }}>
                {dayData.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Goal achievement panel */}
      <div className="glass-panel" style={{ background: 'rgba(255, 159, 28, 0.05)', borderColor: 'rgba(255, 159, 28, 0.15)' }}>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '16px', margin: '0 0 8px 0', color: 'var(--color-secondary)' }}>
          Burger's Hydration Tip
        </h2>
        <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>
          "Meow! Drinking water helps you stay energized and focused throughout the day. Keeping my water bowl filled keeps my tail wagging! Log water regularly to unlock my sunglasses state!"
        </p>
      </div>
    </div>
  );
}
