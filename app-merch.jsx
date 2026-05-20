/* global React, CAST */
const { useState: useStateM, useRef: useRefM, useEffect: useEffectM } = React;

/* =========================================================================
 * Merch section — product grid + product detail modal + cart drawer
 * Cart persists in localStorage. "Notify me" for coming-soon items.
 * ========================================================================= */

const PRODUCTS = [
  {
    id: 'tee-classic',
    name: 'Capy Classic Tee',
    nameTh: 'เสื้อยืดคาปี้',
    price: 690,
    tag: 'New',
    blurb: 'Heavy 240gsm cotton, brown ink screen-print of CAPY on the front. Unisex fit.',
    blurbTh: 'ผ้าฝ้าย 240 แกรม สกรีนหมึกน้ำตาล รูปคาปี้ที่หน้าอก',
    bg: '#FFD261',
    overlay: 'assets/capy.svg',
    stock: 'in',
    size: ['S','M','L','XL'],
  },
  {
    id: 'sticker-set',
    name: 'Wheek Sticker Pack',
    nameTh: 'สติ๊กเกอร์เซต',
    price: 220,
    tag: 'Bestseller',
    blurb: 'Die-cut vinyl, weatherproof. Set of 5 — one of each capy. Stick on laptops, cups, friends.',
    blurbTh: 'ไวนิลกันน้ำ ตัดลายชิ้นละตัว 5 ตัวครบเซต',
    bg: '#267F55',
    overlayKind: 'sticker-pack',
    stock: 'in',
  },
  {
    id: 'plush-capy',
    name: 'Capy Plushie',
    nameTh: 'ตุ๊กตาคาปี้',
    price: 1290,
    tag: 'Coming Soon',
    blurb: '20cm tall, super soft minky fur, embroidered face. Limited run of 200.',
    blurbTh: 'สูง 20 ซม. ขนนุ่มมาก ปักหน้าด้วยมือ ผลิตจำกัด 200 ตัว',
    bg: '#F28522',
    overlay: 'assets/capoi.svg',
    stock: 'soon',
  },
  {
    id: 'pin-set',
    name: 'Enamel Pin Set',
    nameTh: 'พินอินาเมล',
    price: 480,
    tag: 'Limited',
    blurb: 'Hard enamel, gold-plated. Five pins, one of each capy. Rubber backings included.',
    blurbTh: 'เคลือบอินาเมลแข็ง ชุบทอง 5 อัน ครบทุกตัว',
    bg: '#704C28',
    overlayKind: 'pin-set',
    stock: 'in',
  },
  {
    id: 'tote',
    name: 'Don\u2019t Worry Tote',
    nameTh: 'กระเป๋าผ้า',
    price: 390,
    tag: null,
    blurb: 'Heavyweight canvas tote, 35x40cm. Screen-printed slogan and badge.',
    blurbTh: 'ผ้าแคนวาสหนา 35x40 ซม. สกรีนสโลแกนและตราสัญลักษณ์',
    bg: '#FFF6E2',
    overlayKind: 'tote',
    stock: 'in',
  },
  {
    id: 'mug',
    name: 'Wheek Wheek Mug',
    nameTh: 'แก้วเซรามิก',
    price: 320,
    tag: null,
    blurb: 'Ceramic 330ml. Microwave + dishwasher safe. Capy on one side, slogan on the other.',
    blurbTh: 'เซรามิก 330 มล. เข้าไมโครเวฟและล้างเครื่องได้',
    bg: '#969184',
    overlay: 'assets/barand.svg',
    stock: 'in',
  },
  {
    id: 'keyring',
    name: 'Acrylic Keyring',
    nameTh: 'พวงกุญแจ',
    price: 180,
    tag: null,
    blurb: 'Double-sided acrylic charm, 6cm. Pick your favourite capy.',
    blurbTh: 'อะคริลิคพิมพ์สองหน้า 6 ซม. เลือกตัวที่ชอบ',
    bg: '#FFE7A8',
    overlayKind: 'keyring',
    stock: 'in',
    variant: ['Capy','Barand','Capoi','Baboon','Capu'],
  },
  {
    id: 'sticker-big',
    name: 'Capybarand Badge',
    nameTh: 'สติ๊กเกอร์ตราสัญลักษณ์',
    price: 90,
    tag: null,
    blurb: 'Big circular badge sticker, 10cm. Perfect for the back of your laptop.',
    blurbTh: 'สติ๊กเกอร์วงกลม 10 ซม. ติดหลังโน้ตบุ๊กก็ปังมาก',
    bg: '#FFD261',
    overlay: 'assets/badge.svg',
    stock: 'in',
  },
];

/* ----- Cart store (localStorage) ----- */
function readCart() {
  try { return JSON.parse(localStorage.getItem('capy-cart') || '[]'); }
  catch { return []; }
}
function writeCart(items) {
  try { localStorage.setItem('capy-cart', JSON.stringify(items)); } catch {}
}

/* ----- Product visual: a colored card with the capy/element overlaid ----- */
function ProductVisual({ product }) {
  const bg = product.bg;
  if (product.overlay) {
    return (
      <div className="product-visual" style={{ background: bg }}>
        <img src={product.overlay} alt="" draggable={false} />
        <div className="product-grid-bg" />
      </div>
    );
  }
  if (product.overlayKind === 'sticker-pack') {
    return (
      <div className="product-visual" style={{ background: bg }}>
        <div className="sticker-stack">
          {CAST.map((c, i) => (
            <img key={c.id} src={c.src} alt=""
              style={{ '--i': i, '--n': CAST.length }} />
          ))}
        </div>
      </div>
    );
  }
  if (product.overlayKind === 'pin-set') {
    return (
      <div className="product-visual" style={{ background: bg }}>
        <div className="pin-grid">
          {CAST.map((c) => (
            <div key={c.id} className="pin">
              <img src={c.src} alt="" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (product.overlayKind === 'tote') {
    return (
      <div className="product-visual" style={{ background: bg }}>
        <div className="tote-mock">
          <div className="tote-handle left" />
          <div className="tote-handle right" />
          <div className="tote-body">
            <div className="tote-print">
              <div className="font-disp" style={{ fontSize: 24, lineHeight: 0.95 }}>
                DON\u2019T<br/>WORRY,<br/>BE&nbsp;CAPY.
              </div>
              <img src="assets/badge.svg" alt="" style={{ width: 56, marginTop: 8 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (product.overlayKind === 'keyring') {
    return (
      <div className="product-visual" style={{ background: bg }}>
        <div className="keyring-mock">
          <div className="keyring-ring" />
          <div className="keyring-chip">
            <img src="assets/capy.svg" alt="" />
          </div>
        </div>
      </div>
    );
  }
  return <div className="product-visual" style={{ background: bg }} />;
}

/* ----- A single product card ----- */
function ProductCard({ product, onOpen, onAdd, soundOn }) {
  const isComing = product.stock === 'soon';
  return (
    <div className="product-card" onClick={() => onOpen(product)}>
      <ProductVisual product={product} />
      {product.tag && (
        <span className={`product-tag ${isComing ? 'soon' : ''}`}>{product.tag}</span>
      )}
      <div className="product-meta">
        <div>
          <div className="product-name">{product.name}</div>
          <div className="product-name-th">{product.nameTh}</div>
        </div>
        <div className="product-price">฿{product.price}</div>
      </div>
      <button
        className={`pxbtn ${isComing ? '' : 'orange'} product-btn`}
        onClick={(e) => { e.stopPropagation(); onAdd(product); }}
      >
        {isComing ? 'Notify Me' : 'Add to Cart'}
      </button>
    </div>
  );
}

/* ----- Product detail modal ----- */
function ProductModal({ product, onClose, onAdd }) {
  const [size, setSize] = useStateM(product?.size?.[1] || null);
  const [variant, setVariant] = useStateM(product?.variant?.[0] || null);
  if (!product) return null;
  const isComing = product.stock === 'soon';
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="close">×</button>
        <div className="modal-grid">
          <ProductVisual product={product} />
          <div className="modal-info">
            {product.tag && <span className={`product-tag inline ${isComing ? 'soon' : ''}`}>{product.tag}</span>}
            <h3 className="modal-name">{product.name}</h3>
            <div className="modal-name-th">{product.nameTh}</div>
            <div className="modal-price">฿{product.price}</div>
            <p className="modal-blurb">{product.blurb}</p>
            <p className="modal-blurb-th">{product.blurbTh}</p>
            {product.size && (
              <div className="option-row">
                <span>Size</span>
                <div className="option-chips">
                  {product.size.map(s => (
                    <button key={s}
                      className={size === s ? 'chip on' : 'chip'}
                      onClick={() => setSize(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {product.variant && (
              <div className="option-row">
                <span>Capy</span>
                <div className="option-chips">
                  {product.variant.map(v => (
                    <button key={v}
                      className={variant === v ? 'chip on' : 'chip'}
                      onClick={() => setVariant(v)}>{v}</button>
                  ))}
                </div>
              </div>
            )}
            <button
              className="pxbtn orange"
              style={{ marginTop: 20 }}
              onClick={() => { onAdd(product, { size, variant }); onClose(); }}
            >
              {isComing ? 'Notify Me' : `Add to Cart \u00b7 \u00a3{product.price}`.replace('£','฿')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----- Cart drawer ----- */
function CartDrawer({ open, onClose, items, onChangeQty, onRemove }) {
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  return (
    <>
      <div
        className={`cart-backdrop ${open ? 'on' : ''}`}
        onClick={onClose}
      />
      <aside className={`cart-drawer ${open ? 'on' : ''}`} aria-hidden={!open}>
        <header className="cart-head">
          <span className="font-disp" style={{ fontSize: 22 }}>Your Cart</span>
          <button className="cart-close" onClick={onClose} aria-label="close">×</button>
        </header>
        <div className="cart-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <div className="font-disp" style={{ fontSize: 22 }}>So empty...</div>
              <div style={{ marginTop: 8, color: 'var(--ink-soft)' }}>Drop a capy in here ♡</div>
            </div>
          ) : items.map((it, idx) => (
            <div key={idx} className="cart-item">
              <div className="cart-thumb" style={{ background: it.bg }}>
                {it.overlay && <img src={it.overlay} alt="" />}
              </div>
              <div className="cart-info">
                <div className="cart-name">{it.name}</div>
                {(it.size || it.variant) && (
                  <div className="cart-opt">
                    {it.size && `Size ${it.size}`}
                    {it.size && it.variant ? ' · ' : ''}
                    {it.variant && `${it.variant}`}
                  </div>
                )}
                <div className="cart-row">
                  <div className="qty-stepper">
                    <button onClick={() => onChangeQty(idx, -1)}>−</button>
                    <span>{it.qty}</span>
                    <button onClick={() => onChangeQty(idx, +1)}>+</button>
                  </div>
                  <div className="cart-price">฿{it.price * it.qty}</div>
                </div>
              </div>
              <button className="cart-x" onClick={() => onRemove(idx)} aria-label="remove">×</button>
            </div>
          ))}
        </div>
        <footer className="cart-foot">
          <div className="cart-total">
            <span>Total</span>
            <span className="cart-total-amount">฿{total}</span>
          </div>
          <button className="pxbtn orange" style={{ width: '100%' }}
            disabled={items.length === 0}
            onClick={() => alert('Checkout opens in 2027 ✦ wheek wheek')}>
            Checkout
          </button>
        </footer>
      </aside>
    </>
  );
}

/* ----- Notify modal (for coming-soon items) ----- */
function NotifyToast({ open, onClose, product }) {
  if (!open || !product) return null;
  return (
    <div className="toast">
      <div className="toast-card">
        <div className="font-disp" style={{ fontSize: 22 }}>You\u2019re on the list ♡</div>
        <div style={{ marginTop: 6, color: 'var(--ink-soft)' }}>
          We\u2019ll wheek you when {product.name} drops.
        </div>
        <button className="pxbtn" onClick={onClose} style={{ marginTop: 14 }}>OK</button>
      </div>
    </div>
  );
}

/* =========================================================================
 * Main Merch section
 * ========================================================================= */
function Merch() {
  const [open, setOpen] = useStateM(null); // product being viewed
  const [cart, setCart] = useStateM(readCart);
  const [drawerOpen, setDrawerOpen] = useStateM(false);
  const [notify, setNotify] = useStateM(null);
  const [filter, setFilter] = useStateM('all');

  useEffectM(() => { writeCart(cart); }, [cart]);

  const addToCart = (p, opts = {}) => {
    if (p.stock === 'soon') { setNotify(p); return; }
    setCart(prev => {
      const key = p.id + '|' + (opts.size || '') + '|' + (opts.variant || '');
      const idx = prev.findIndex(it => it.key === key);
      if (idx >= 0) {
        return prev.map((it, i) => i === idx ? { ...it, qty: it.qty + 1 } : it);
      }
      return [...prev, {
        key, id: p.id, name: p.name, price: p.price,
        bg: p.bg, overlay: p.overlay,
        size: opts.size, variant: opts.variant, qty: 1,
      }];
    });
    setDrawerOpen(true);
  };
  const changeQty = (idx, delta) => {
    setCart(prev => prev.map((it, i) =>
      i === idx ? { ...it, qty: Math.max(1, it.qty + delta) } : it
    ));
  };
  const remove = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));

  const filtered = PRODUCTS.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'wear') return ['tee-classic','tote'].includes(p.id);
    if (filter === 'small') return ['sticker-set','pin-set','keyring','sticker-big'].includes(p.id);
    if (filter === 'home') return ['mug','plush-capy'].includes(p.id);
    return true;
  });
  const itemCount = cart.reduce((s, it) => s + it.qty, 0);

  return (
    <section id="shop" className="merch">
      {/* floating cart button */}
      <button className="cart-fab" onClick={() => setDrawerOpen(true)} aria-label="open cart">
        <span style={{ fontSize: 22 }}>🛒</span>
        {itemCount > 0 && <span className="cart-fab-count">{itemCount}</span>}
      </button>

      <div className="section-inner">
        <div className="section-eyebrow">✦ Shop · ร้านค้า</div>
        <h2 className="section-title">The Capy Store</h2>
        <div className="section-th">ของขวัญสำหรับคนรักคาปี้ · เปิดพรีออเดอร์</div>

        <div className="merch-filters">
          {[
            { id: 'all',   label: 'All'      },
            { id: 'wear',  label: 'Apparel'  },
            { id: 'small', label: 'Stickers & Pins' },
            { id: 'home',  label: 'Home & Cuddle' },
          ].map(f => (
            <button key={f.id}
              className={`merch-chip ${filter === f.id ? 'on' : ''}`}
              onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="merch-grid">
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onOpen={setOpen}
              onAdd={addToCart}
            />
          ))}
        </div>

        <div className="merch-notice">
          <div className="font-disp" style={{ fontSize: 22 }}>Free shipping over ฿1,000 ✦</div>
          <div className="font-th" style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 4 }}>
            ส่งฟรีในไทยเมื่อซื้อครบ 1,000 บาท · ขายต่างประเทศเร็ว ๆ นี้
          </div>
        </div>
      </div>

      <ProductModal product={open} onClose={() => setOpen(null)} onAdd={addToCart} />
      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={cart}
        onChangeQty={changeQty}
        onRemove={remove}
      />
      <NotifyToast open={!!notify} onClose={() => setNotify(null)} product={notify} />
    </section>
  );
}

Object.assign(window, { Merch });
