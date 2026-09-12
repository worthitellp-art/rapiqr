import React, { useEffect, useState } from 'react';
import {
  Package, Plus, Pencil, Trash2, Loader2, X, ImageOff, Star, EyeOff, Eye,
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import ConfirmModal from './ConfirmModal';

interface ShopProduct {
  id: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  features: string[];
  price: number;
  mrp: number;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  sku: string;
  weightGrams: number | null;
  lengthCm: number | null;
  breadthCm: number | null;
  heightCm: number | null;
  isActive: boolean;
  sortOrder: number;
}

const EMPTY_FORM = {
  name: '',
  category: 'Vehicle',
  badge: '',
  description: '',
  featuresText: '',
  price: '',
  mrp: '',
  imageUrl: '',
  rating: '',
  reviewsCount: '',
  sku: '',
  weightGrams: '',
  lengthCm: '',
  breadthCm: '',
  heightCm: '',
  isActive: true,
  sortOrder: '0',
};

type FormState = typeof EMPTY_FORM;

function productToForm(p: ShopProduct): FormState {
  return {
    name: p.name || '',
    category: p.category || 'Vehicle',
    badge: p.badge || '',
    description: p.description || '',
    featuresText: (p.features || []).join('\n'),
    price: String(p.price ?? ''),
    mrp: String(p.mrp ?? ''),
    imageUrl: p.imageUrl || '',
    rating: p.rating ? String(p.rating) : '',
    reviewsCount: p.reviewsCount ? String(p.reviewsCount) : '',
    sku: p.sku || '',
    weightGrams: p.weightGrams != null ? String(p.weightGrams) : '',
    lengthCm: p.lengthCm != null ? String(p.lengthCm) : '',
    breadthCm: p.breadthCm != null ? String(p.breadthCm) : '',
    heightCm: p.heightCm != null ? String(p.heightCm) : '',
    isActive: p.isActive !== false,
    sortOrder: String(p.sortOrder ?? 0),
  };
}

function formToPayload(f: FormState) {
  return {
    name: f.name.trim(),
    category: f.category.trim() || 'Vehicle',
    badge: f.badge.trim(),
    description: f.description.trim(),
    features: f.featuresText.split('\n').map((s) => s.trim()).filter(Boolean),
    price: Number(f.price) || 0,
    mrp: Number(f.mrp) || Number(f.price) || 0,
    imageUrl: f.imageUrl.trim(),
    rating: f.rating ? Number(f.rating) : 0,
    reviewsCount: f.reviewsCount ? Number(f.reviewsCount) : 0,
    sku: f.sku.trim() || null,
    weightGrams: f.weightGrams ? Number(f.weightGrams) : null,
    lengthCm: f.lengthCm ? Number(f.lengthCm) : null,
    breadthCm: f.breadthCm ? Number(f.breadthCm) : null,
    heightCm: f.heightCm ? Number(f.heightCm) : null,
    isActive: f.isActive,
    sortOrder: Number(f.sortOrder) || 0,
  };
}

export default function ShopProductsPage({ setToast }: { setToast: (msg: string | null) => void }) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; id: string } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShopProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiClient.shopProducts.listAdmin();
      setProducts(res?.data || []);
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setModal({ mode: 'create' }); };
  const openEdit = (p: ShopProduct) => { setForm(productToForm(p)); setModal({ mode: 'edit', id: p.id }); };
  const closeModal = () => { if (!saving) setModal(null); };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!form.name.trim() || !form.price) {
      showToast('Product name and price are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (modal?.mode === 'create') {
        const res = await apiClient.shopProducts.create(payload);
        if (res?.success) {
          showToast(`"${payload.name}" added to the shop.`);
          setModal(null);
          load();
        } else {
          showToast(res?.error || 'Failed to create product.');
        }
      } else if (modal?.mode === 'edit') {
        const res = await apiClient.shopProducts.update(modal.id, payload);
        if (res?.success) {
          showToast(`"${payload.name}" updated.`);
          setModal(null);
          load();
        } else {
          showToast(res?.error || 'Failed to update product.');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Something went wrong saving the product.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: ShopProduct) => {
    try {
      const res = await apiClient.shopProducts.update(p.id, { isActive: !p.isActive });
      if (res?.success) {
        setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, isActive: !p.isActive } : x)));
        showToast(!p.isActive ? `"${p.name}" is now live on the landing page.` : `"${p.name}" hidden from the landing page.`);
      }
    } catch {
      showToast('Failed to update visibility.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiClient.shopProducts.remove(deleteTarget.id);
      if (res?.success) {
        showToast(`"${deleteTarget.name}" deleted.`);
        setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      } else {
        showToast('Failed to delete product.');
      }
    } catch {
      showToast('Failed to delete product.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-16 space-y-6 text-[var(--fx-ink)] font-body" style={{ background: 'var(--fx-canvas)' }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[var(--fx-accent-soft)] text-[var(--fx-accent-ink)] flex items-center justify-center shrink-0">
            <Package size={21} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-[24px] font-bold text-[var(--fx-ink)] leading-tight tracking-[-0.5px] flex items-center gap-2.5">
              Shop Products
              <span className="inline-flex items-center px-2.5 h-6 rounded-full bg-white text-[var(--fx-ink-2)] text-[11px] font-bold border border-[var(--fx-border)]">
                {products.length}
              </span>
            </h1>
            <p className="text-[13px] text-[var(--fx-ink-2)] mt-0.5">
              What's shown in the landing page shop and the client dashboard's pre-purchase shop.
            </p>
          </div>
        </div>
        <button onClick={openCreate} className="fx-btn fx-btn-primary">
          <Plus size={15} strokeWidth={2.5} /> Add product
        </button>
      </div>

      <div className="bg-white border border-[var(--fx-border)] rounded-xl shadow-[0_1px_2px_rgba(24,24,27,0.05)] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 size={22} className="animate-spin mx-auto text-[var(--fx-accent-ink)]" />
            <p className="font-semibold text-[13px]">Loading products…</p>
          </div>
        ) : loadError ? (
          <div className="p-16 text-center space-y-3">
            <p className="font-bold text-[13px]">Couldn't load products.</p>
            <p className="text-[12px] text-[var(--fx-ink-2)] font-mono">{loadError}</p>
            <button onClick={load} className="fx-btn fx-btn-secondary h-10">Retry</button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Package size={28} className="mx-auto text-[var(--fx-faint)]" />
            <p className="font-bold text-[13px]">No products yet.</p>
            <p className="text-[12.5px] text-[var(--fx-ink-2)] max-w-[420px] mx-auto">
              The landing page and client shop fall back to the built-in default catalog until you add at least one product here.
            </p>
            <button onClick={openCreate} className="fx-btn fx-btn-primary h-10 mx-auto">
              <Plus size={14} /> Add your first product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {products.map((p) => (
              <div key={p.id} className="border border-[var(--fx-border)] rounded-xl overflow-hidden flex flex-col bg-white">
                <div className="relative aspect-[16/10] bg-[var(--fx-canvas)] flex items-center justify-center overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff size={22} className="text-[var(--fx-faint)]" />
                  )}
                  {!p.isActive && (
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-[13.5px] text-[var(--fx-ink)] truncate">{p.name}</h3>
                      <div className="shrink-0 text-right">
                        <div className="font-bold text-[13px] text-[var(--fx-ink)]">₹{p.price}</div>
                        {p.mrp > p.price && <div className="text-[11px] text-[var(--fx-faint)] line-through">₹{p.mrp}</div>}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--fx-ink-2)]">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--fx-canvas)] border border-[var(--fx-border)]">{p.category}</span>
                      {p.rating > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <Star size={11} className="text-amber-500" fill="currentColor" /> {p.rating}
                        </span>
                      )}
                    </div>
                    {p.description && <p className="mt-1.5 text-[12px] text-[var(--fx-ink-2)] line-clamp-2">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openEdit(p)} className="flex-1 fx-btn fx-btn-secondary h-8 text-[11.5px]">
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={() => toggleActive(p)}
                      title={p.isActive ? 'Hide from landing page' : 'Show on landing page'}
                      className="flex items-center justify-center w-8 h-8 rounded-[8px] border border-[var(--fx-border)] text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer"
                    >
                      {p.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      title="Delete product"
                      className="flex items-center justify-center w-8 h-8 rounded-[8px] border border-[#FECACA] text-[#EF4444] hover:bg-[#FEF2F2] cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-[var(--fx-ink)]/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-fade-in" onClick={closeModal}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[var(--fx-border)] p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-modal-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-[17px] font-bold text-[var(--fx-ink)] tracking-[-0.3px]">
                  {modal.mode === 'create' ? 'Add product' : 'Edit product'}
                </h2>
                <p className="text-[12.5px] text-[var(--fx-ink-2)] mt-0.5">
                  Everything here is shown on the public landing page shop and the client dashboard's pre-purchase shop.
                </p>
              </div>
              <button onClick={closeModal} className="flex items-center justify-center w-8 h-8 rounded-[8px] text-[var(--fx-ink-2)] hover:bg-[var(--fx-canvas)] cursor-pointer" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="fx-label mb-1.5 block">Product name *</label>
                  <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. Automobile Safety Tag" className="fx-input" />
                </div>
                <div>
                  <label className="fx-label mb-1.5 block">Category</label>
                  <input type="text" value={form.category} onChange={(e) => setField('category', e.target.value)} placeholder="Vehicle / Home / Family / Travel" className="fx-input" />
                </div>
                <div>
                  <label className="fx-label mb-1.5 block">Badge</label>
                  <input type="text" value={form.badge} onChange={(e) => setField('badge', e.target.value)} placeholder="e.g. For vehicles" className="fx-input" />
                </div>
                <div className="sm:col-span-2">
                  <label className="fx-label mb-1.5 block">Description</label>
                  <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Shown under the product name" className="fx-input min-h-[70px]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="fx-label mb-1.5 block">Features (one per line)</label>
                  <textarea value={form.featuresText} onChange={(e) => setField('featuresText', e.target.value)} placeholder={'Parking issue masked call\nTow & emergency alert'} className="fx-input min-h-[80px] font-mono text-[12px]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="fx-label mb-1.5 block">Image URL</label>
                  <input type="text" value={form.imageUrl} onChange={(e) => setField('imageUrl', e.target.value)} placeholder="https://..." className="fx-input" />
                </div>

                <div>
                  <label className="fx-label mb-1.5 block">Price (₹) *</label>
                  <input type="number" min="0" value={form.price} onChange={(e) => setField('price', e.target.value)} placeholder="299" className="fx-input" />
                </div>
                <div>
                  <label className="fx-label mb-1.5 block">MRP (₹)</label>
                  <input type="number" min="0" value={form.mrp} onChange={(e) => setField('mrp', e.target.value)} placeholder="599" className="fx-input" />
                </div>

                <div>
                  <label className="fx-label mb-1.5 block">Rating (0–5)</label>
                  <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => setField('rating', e.target.value)} placeholder="4.9" className="fx-input" />
                </div>
                <div>
                  <label className="fx-label mb-1.5 block">Reviews count</label>
                  <input type="number" min="0" value={form.reviewsCount} onChange={(e) => setField('reviewsCount', e.target.value)} placeholder="3840" className="fx-input" />
                </div>

                <div>
                  <label className="fx-label mb-1.5 block">SKU</label>
                  <input type="text" value={form.sku} onChange={(e) => setField('sku', e.target.value)} placeholder="Optional" className="fx-input" />
                </div>
                <div>
                  <label className="fx-label mb-1.5 block">Sort order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setField('sortOrder', e.target.value)} placeholder="0" className="fx-input" />
                </div>

                <div>
                  <label className="fx-label mb-1.5 block">Weight (grams)</label>
                  <input type="number" min="0" value={form.weightGrams} onChange={(e) => setField('weightGrams', e.target.value)} placeholder="Optional" className="fx-input" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="fx-label mb-1.5 block">L (cm)</label>
                    <input type="number" min="0" value={form.lengthCm} onChange={(e) => setField('lengthCm', e.target.value)} className="fx-input" />
                  </div>
                  <div>
                    <label className="fx-label mb-1.5 block">B (cm)</label>
                    <input type="number" min="0" value={form.breadthCm} onChange={(e) => setField('breadthCm', e.target.value)} className="fx-input" />
                  </div>
                  <div>
                    <label className="fx-label mb-1.5 block">H (cm)</label>
                    <input type="number" min="0" value={form.heightCm} onChange={(e) => setField('heightCm', e.target.value)} className="fx-input" />
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-center gap-2.5 pt-1">
                  <input
                    id="shop-product-active"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setField('isActive', e.target.checked)}
                    className="w-4 h-4 rounded border-[#D0D5DD] text-[var(--fx-accent-ink)] cursor-pointer"
                  />
                  <label htmlFor="shop-product-active" className="text-[12.5px] font-semibold text-[var(--fx-ink)] cursor-pointer">
                    Live on the landing page shop
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--fx-border)] mt-2">
              <button onClick={closeModal} disabled={saving} className="fx-btn fx-btn-secondary">Cancel</button>
              <button onClick={submit} disabled={saving} className="fx-btn fx-btn-primary">
                {saving && <Loader2 size={15} className="animate-spin" />}
                {modal.mode === 'create' ? (saving ? 'Adding…' : 'Add product') : (saving ? 'Saving…' : 'Save changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete product?"
        message={<>This removes <strong>{deleteTarget?.name}</strong> from the shop permanently. This can't be undone.</>}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={confirmDelete}
        onClose={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}
