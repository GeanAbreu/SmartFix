interface GlobalMetrics {
  totalOrders: number;
  totalVolume: number;
  activeUsers: number;
  completionRate: number;
}

const metricsData: Record<string, GlobalMetrics> = {
  '7d': { totalOrders: 310, totalVolume: 45200.00, activeUsers: 1120, completionRate: 95.1 },
  '30d': { totalOrders: 1248, totalVolume: 184500.00, activeUsers: 3420, completionRate: 94.2 },
  '90d': { totalOrders: 3890, totalVolume: 560000.00, activeUsers: 6800, completionRate: 93.8 },
  '1y': { totalOrders: 14500, totalVolume: 2150000.00, activeUsers: 15400, completionRate: 94.5 }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof (window as any).lucide !== 'undefined') {
    (window as any).lucide.createIcons();
  }

  const periods = ['7d', '30d', '90d', '1y'];

  periods.forEach(period => {
    const btn = document.getElementById(`btn-${period}`);
    btn?.addEventListener('click', () => {
      periods.forEach(p => {
        const b = document.getElementById(`btn-${p}`);
        if (b) {
          if (p === period) {
            b.className = "period-btn px-3.5 py-1.5 text-xs font-bold rounded-lg bg-brand-orange text-white shadow";
          } else {
            b.className = "period-btn px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:bg-brand-navy-light transition";
          }
        }
      });

      const data = metricsData[period];
      if (data) {
        const totalOrders = document.getElementById('kpi-total-orders');
        const totalVolume = document.getElementById('kpi-total-volume');
        const activeUsers = document.getElementById('kpi-active-users');
        const completionRate = document.getElementById('kpi-completion-rate');

        if (totalOrders) totalOrders.innerText = data.totalOrders.toLocaleString('pt-BR');
        if (totalVolume) totalVolume.innerText = `R$ ${data.totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        if (activeUsers) activeUsers.innerText = data.activeUsers.toLocaleString('pt-BR');
        if (completionRate) completionRate.innerText = `${data.completionRate}%`;
      }
    });
  });
});