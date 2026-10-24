import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { fetchOrder, fetchOrders, syncOrders, type OrderFilters } from './api';
import type { Order } from './types';

const initialFilters: OrderFilters = {
  page: 1,
  pageSize: 10,
  search: '',
  financialStatus: '',
  fulfillmentStatus: '',
  from: '',
  to: '',
};

const money = (amount: string | null, currency = 'USD') => {
  if (amount === null) return '-';
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(amount));
  } catch {
    return `${currency} ${amount}`;
  }
};

const date = (value: string) => new Intl.DateTimeFormat('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(value));

const titleCase = (value: string | null) => value
  ? value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  : 'Unknown';

function StatusPill({ value, kind }: { value: string | null; kind: 'financial' | 'fulfillment' }) {
  const normalized = value?.toLowerCase() ?? 'unknown';
  return <span className={`status-pill ${kind} ${normalized}`}>{titleCase(value)}</span>;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/">
          <span className="brand-mark">O</span>
          <span><strong>Orbit</strong><small>orders CRM</small></span>
        </Link>
        <nav><Link className="nav-link active" to="/"><span>◆</span> Orders</Link></nav>
        <div className="sidebar-footer">
          <span className="online-dot" /> Backend connected
          <small>Development demo</small>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div><span className="eyebrow">WORKSPACE</span><span className="topbar-title">Order operations</span></div>
          <div className="topbar-user"><span className="avatar">SA</span><span>Store admin</span><span className="chevron">⌄</span></div>
        </header>
        {children}
      </main>
    </div>
  );
}

function OrdersPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, fulfilled: 0, needsAttention: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchOrders(filters)
      .then((response) => {
        if (!active) return;
        setOrders(response.data);
        setTotal(response.meta.total);
        setTotalPages(response.meta.totalPages);
        setStats(response.stats);
        setBackendConnected(true);
      })
      .catch((reason: Error) => {
        if (!active) return;
        setBackendConnected(false);
        setError(reason.message);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [filters, refreshKey]);

  const refresh = () => setRefreshKey((current) => current + 1);
  const update = (key: keyof OrderFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value, ...(key !== 'page' ? { page: 1 } : {}) }));
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    setError('');
    try {
      const response = await syncOrders();
      setSyncMessage(`${response.summary.fetched} Shopify orders checked`);
      refresh();
    } catch (reason) {
      setSyncMessage(reason instanceof Error ? reason.message : 'Shopify sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <section className="page">
      <div className="page-heading">
        <div><span className="eyebrow">DEVELOPMENT DEMO DATA</span><h1>Orders</h1><p>Keep every order moving from checkout to delivery.</p></div>
        <div className="heading-actions"><span className="sync-status"><span className={`online-dot ${backendConnected ? '' : 'offline-dot'}`} /> {backendConnected ? 'Backend connected' : 'Backend unavailable'}</span><button className="primary-button" disabled={syncing || !backendConnected} onClick={handleSync}>{syncing ? 'Syncing...' : 'Sync Shopify'}</button></div>
      </div>
      {syncMessage && <p className="sync-message">{syncMessage}</p>}

      <div className="stat-row">
        <div className="stat-card accent"><div className="stat-icon">↗</div><div><span>Total orders</span><strong>{stats.total.toLocaleString()}</strong><small>Across all statuses</small></div></div>
        <div className="stat-card"><div className="stat-icon green">✓</div><div><span>Paid</span><strong>{stats.paid.toLocaleString()}</strong><small>Payment captured</small></div></div>
        <div className="stat-card"><div className="stat-icon amber">•</div><div><span>Pending</span><strong>{stats.pending.toLocaleString()}</strong><small>Payment pending</small></div></div>
        <div className="stat-card"><div className="stat-icon blue">→</div><div><span>Fulfilled</span><strong>{stats.fulfilled.toLocaleString()}</strong><small>Ready to close</small></div></div>
        <div className="stat-card"><div className="stat-icon rose">!</div><div><span>Needs attention</span><strong>{stats.needsAttention.toLocaleString()}</strong><small>Payment or fulfillment</small></div></div>
      </div>

      <div className="panel">
        <div className="panel-heading"><div><h2>All orders</h2><span>{total.toLocaleString()} records</span></div><button className="ghost-button" onClick={refresh}>↻ Refresh</button></div>
        <div className="filters">
          <label className="search-field"><span>⌕</span><input value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Search order or customer" /></label>
          <select value={filters.financialStatus} onChange={(event) => update('financialStatus', event.target.value)}><option value="">Payment status</option><option value="PAID">Paid</option><option value="PENDING">Pending</option><option value="REFUNDED">Refunded</option><option value="PARTIALLY_PAID">Partially paid</option></select>
          <select value={filters.fulfillmentStatus} onChange={(event) => update('fulfillmentStatus', event.target.value)}><option value="">Fulfillment status</option><option value="FULFILLED">Fulfilled</option><option value="UNFULFILLED">Unfulfilled</option><option value="PARTIALLY_FULFILLED">Partially fulfilled</option><option value="IN_PROGRESS">In progress</option></select>
          <label className="date-field"><span>From</span><input type="date" value={filters.from} onChange={(event) => update('from', event.target.value)} /></label>
          <label className="date-field"><span>To</span><input type="date" value={filters.to} onChange={(event) => update('to', event.target.value)} /></label>
        </div>

        {loading ? <div className="state"><div className="spinner" /><p>Loading orders...</p></div> : error ? <div className="state error-state"><div className="state-icon">!</div><h3>Could not load orders</h3><p>{error}. Check that the backend is running on port 3000.</p><button className="primary-button" onClick={refresh}>Try again</button></div> : orders.length === 0 ? <div className="state"><div className="state-icon">⌁</div><h3>No orders found</h3><p>Try changing your search or filters.</p></div> : (
          <div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Payment</th><th>Fulfillment</th><th>Total</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><Link className="order-link" to={`/orders/${order.id}`}>{order.orderNumber}</Link><small className="muted-id">#{order.shopifyId}</small></td><td><div className="customer-cell"><span className="mini-avatar">{(order.customerName ?? 'Guest').slice(0, 1).toUpperCase()}</span><span>{order.customerName ?? 'Guest customer'}<small>{order.customerEmail ?? 'No email available'}</small></span></div></td><td className="date-cell">{date(order.orderedAt)}</td><td><StatusPill value={order.financialStatus} kind="financial" /></td><td><StatusPill value={order.fulfillmentStatus} kind="fulfillment" /></td><td className="amount">{money(order.total, order.currencyCode)}</td><td><Link className="view-link" to={`/orders/${order.id}`}>View <span>→</span></Link></td></tr>)}</tbody></table></div>
        )}

        {!loading && !error && orders.length > 0 && <div className="pagination"><span>Showing <strong>{(filters.page - 1) * filters.pageSize + 1}-{Math.min(filters.page * filters.pageSize, total)}</strong> of <strong>{total}</strong></span><div><button disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>←</button><span className="page-number">{filters.page} / {Math.max(totalPages, 1)}</span><button disabled={filters.page >= totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>→</button></div></div>}
      </div>
    </section>
  );
}

function OrderDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrder(id).then((response) => setOrder(response.data)).catch((reason: Error) => setError(reason.message));
  }, [id]);

  const itemCount = useMemo(() => order?.lineItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0, [order]);
  if (error) return <section className="page"><button className="back-link" onClick={() => navigate(-1)}>← Back to orders</button><div className="state error-state"><div className="state-icon">!</div><h3>Could not load this order</h3><p>{error}</p></div></section>;
  if (!order) return <section className="page"><div className="state"><div className="spinner" /><p>Loading order details...</p></div></section>;

  return <section className="page detail-page">
    <button className="back-link" onClick={() => navigate(-1)}>← Back to orders</button>
    <div className="page-heading detail-heading"><div><span className="eyebrow">ORDER DETAILS</span><h1>{order.orderNumber}</h1><p>Placed {date(order.orderedAt)} · {itemCount} item{itemCount === 1 ? '' : 's'}</p></div><div><StatusPill value={order.fulfillmentStatus} kind="fulfillment" /></div></div>
    <div className="detail-grid">
      <div className="panel customer-panel"><div className="panel-heading"><div><h2>Customer</h2><span>Contact information</span></div><span className="large-avatar">{(order.customerName ?? 'Guest').slice(0, 1).toUpperCase()}</span></div><div className="customer-detail"><strong>{order.customerName ?? 'Guest customer'}</strong><span>{order.customerEmail ?? 'No email available'}</span><span className="customer-id">Customer ID: {order.customerId ?? 'Not available'}</span></div></div>
      <div className="panel status-panel"><div className="panel-heading"><div><h2>Order status</h2><span>Current Shopify state</span></div></div><div className="status-lines"><div><span>Payment</span><StatusPill value={order.financialStatus} kind="financial" /></div><div><span>Fulfillment</span><StatusPill value={order.fulfillmentStatus} kind="fulfillment" /></div><div><span>Currency</span><strong>{order.currencyCode}</strong></div></div></div>
    </div>
    <div className="panel"><div className="panel-heading"><div><h2>Order items</h2><span>{itemCount} items</span></div><span className="order-reference">Shopify ID: {order.shopifyId}</span></div><div className="table-wrap"><table className="items-table"><thead><tr><th>Product</th><th>Variant / SKU</th><th>Qty</th><th>Unit price</th><th className="align-right">Line total</th></tr></thead><tbody>{(order.lineItems ?? []).map((item) => <tr key={item.id}><td><strong>{item.productTitle}</strong></td><td><span>{item.variantTitle ?? 'Default variant'}</span><small>{item.sku ?? 'No SKU'}</small></td><td>{item.quantity}</td><td>{money(item.unitPrice, order.currencyCode)}</td><td className="align-right amount">{money(item.lineTotal, order.currencyCode)}</td></tr>)}</tbody></table></div></div>
    <div className="totals-grid"><div className="panel totals-card"><h2>Summary</h2><div><span>Subtotal</span><strong>{money(order.subtotal, order.currencyCode)}</strong></div><div><span>Shipping</span><strong>{money(order.shipping, order.currencyCode)}</strong></div><div><span>Tax</span><strong>{money(order.tax, order.currencyCode)}</strong></div><div className="grand-total"><span>Total</span><strong>{money(order.total, order.currencyCode)}</strong></div></div><div className="panel note-card"><span className="eyebrow">DEVELOPMENT DEMO DATA</span><h2>CRM record status</h2><p>This record is stored in the CRM database. Shopify sync and webhook delivery are configured separately and are shown as verified only after a real external request succeeds.</p><span className="sync-status"><span className="online-dot" /> Backend connected</span></div></div>
  </section>;
}

export default function App() {
  return <Shell><Routes><Route path="/" element={<OrdersPage />} /><Route path="/orders/:id" element={<OrderDetailsPage />} /></Routes></Shell>;
}
