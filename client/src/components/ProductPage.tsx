import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Star, Check, Share2, Facebook, Sparkles, ArrowLeft } from 'lucide-react';
import { Product, ProductReview, SystemSettings } from '../types';
import { playSuccessBeep } from '../utils/audio';
import * as reviewsService from '../services/reviews';

interface ProductPageProps {
  product: Product;
  reviews: ProductReview[];
  settings: SystemSettings | null;
  currentUser: { email: string; name: string; role: 'admin' | 'cliente' };
  onBack: () => void;
  onShare: (product: Product) => void;
  onBook: (product: Product) => void;
  onPublishFacebook: (productId: string) => void;
  allProducts: Product[];
}

function getProductRatingInfo(productId: string, reviews: ProductReview[]) {
  const prodReviews = reviews.filter(r => r.productId === productId);
  if (prodReviews.length === 0) return { avg: null, count: 0 };
  const sum = prodReviews.reduce((s, r) => s + r.rating, 0);
  return {
    avg: parseFloat((sum / prodReviews.length).toFixed(1)),
    count: prodReviews.length
  };
}

export default function ProductPage({ product, reviews, settings, currentUser, onBack, onShare, onBook, onPublishFacebook, allProducts }: ProductPageProps) {
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (!newReviewComment.trim()) return;
    setIsReviewSubmitting(true);
    try {
      await reviewsService.createReview({
        productId: product.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        rating: newReviewRating,
        comment: newReviewComment.trim()
      });
      setNewReviewComment('');
      setNewReviewRating(5);
      playSuccessBeep();
      window.location.reload();
    } catch (err) {
      console.error("Failed to submit review", err);
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const ratingInfo = getProductRatingInfo(product.id, reviews);
  const productUrl = `${window.location.origin}/producto/${product.id}`;
  const description = `${product.description} | Precio: $${product.price.toLocaleString()} ${product.currency || 'USD'}. ¡Garantía de rendimiento original!`;

  const nextProducts = allProducts
    .filter(p => p.id !== product.id && (p.type === product.type || p.category === product.category))
    .slice(0, 4);

  return (
    <>
      <Helmet>
        <title>{product.name} - Treck Motors Cuba</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${product.name} - Treck Motors Cuba`} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={product.image} />
        <meta property="og:url" content={productUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Treck Motors Cuba" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} - Treck Motors Cuba`} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={product.image} />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto px-4 py-6 space-y-6"
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer font-sans text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span>Volver al Catálogo</span>
        </button>

        {/* Product detail card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 text-left">
            {/* Left Product media */}
            <div className="md:col-span-5 relative aspect-square bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-3 left-3 bg-red-600 text-white font-mono font-bold text-[9px] px-2.5 py-1 rounded-md uppercase border border-red-700/30">
                Soporte Cuba
              </span>
            </div>

            {/* Right detailed specifications */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/10">
                  {product.category}
                </span>
                <h1 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-tight leading-snug">
                  {product.name}
                </h1>

                {/* Status stock info */}
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono font-bold uppercase ${product.stock > 0 ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/10' : 'text-red-500 bg-red-500/10 border-red-500/10'} px-2 py-0.5 rounded border`}>
                    {product.stock > 0 ? 'En Almacén Cuba' : 'Agotado'}
                  </span>
                  <span className="text-[10.5px] font-medium text-zinc-400">
                    ({product.stock} unidades disponibles para reserva)
                  </span>
                </div>

                <p className="font-sans text-[11.5px] text-zinc-400 leading-relaxed pt-1.5">
                  {product.description}
                </p>

                {/* Features list */}
                {product.features && product.features.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide block">Especificaciones Técnicas:</span>
                    <div className="grid grid-cols-2 gap-1.5 font-sans text-[10.5px] text-zinc-300">
                      {product.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 truncate">
                          <Check size={11} className="text-red-500 shrink-0" />
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions reservation footer */}
              <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Monto Reserva Física</span>
                  <span className="font-sans font-black text-red-500 text-lg font-mono">
                    ${product.price.toLocaleString()} {product.currency || 'USD'}
                  </span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => onShare(product)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-sans text-xs font-black transition-all cursor-pointer border border-zinc-700 flex items-center justify-center gap-1.5 shadow-lg shadow-black/10 w-full sm:w-auto"
                  >
                    <Share2 size={13} className="text-red-500" />
                    <span>Compartir</span>
                  </button>

                  {currentUser.role === 'admin' && settings?.facebookPageId && (
                    <button
                      onClick={() => onPublishFacebook(product.id)}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-black transition-all cursor-pointer border border-blue-700 flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/15 w-full sm:w-auto"
                    >
                      <Facebook size={13} />
                      <span>Publicar en FB</span>
                    </button>
                  )}

                  {settings && settings.reservationsEnabled === false ? (
                    <div className="bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl text-[11px] text-zinc-300 w-full sm:max-w-xs">
                      <span className="font-black text-red-500 block">⚠️ RESERVAS ONLINE PAUSADAS</span>
                      Para reservar este artículo, contáctenos en <span className="font-mono text-white text-xs">{settings.contactPhone}</span>.
                    </div>
                  ) : (
                    <button
                      onClick={() => onBook(product)}
                      disabled={product.stock <= 0}
                      className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white font-sans text-xs font-black transition-all cursor-pointer shadow-lg shadow-red-600/15 w-full sm:w-auto"
                    >
                      {product.stock <= 0 ? 'Sin existencias' : 'Reservar para Recogida'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* REVIEWS SEGMENT */}
          <div className="p-6 sm:p-8 bg-zinc-950/85 space-y-6 text-left border-t border-zinc-800/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-900">
              <div className="space-y-1">
                <h2 className="font-sans font-black text-sm text-white uppercase tracking-wider">Valoraciones de la Comunidad</h2>
                <p className="text-[10px] text-zinc-400 font-sans">Opiniones técnicas y experiencias de uso aportadas por mecánicos y aficionados.</p>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 shrink-0">
                <Star className="text-amber-500 fill-amber-500" size={14} />
                <span className="font-mono text-xs font-black text-amber-500">
                  {ratingInfo.avg !== null ? ratingInfo.avg : '5.0'}
                </span>
                <span className="text-[9px] text-zinc-500 font-sans">({ratingInfo.count} reseñas)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Reviews list */}
              <div className="lg:col-span-7 space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {reviews.filter(r => r.productId === product.id).length === 0 ? (
                  <div className="text-center py-12 space-y-3 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
                    <Star size={20} className="text-zinc-700 mx-auto" />
                    <p className="text-[10px] text-zinc-500 font-sans">Este producto aún no cuenta con reseñas escritas. ¡Añade tu opinión abajo!</p>
                  </div>
                ) : (
                  reviews.filter(r => r.productId === product.id).map(rev => (
                    <div key={rev.id} className="p-3.5 bg-zinc-900/50 rounded-xl border border-zinc-800/40 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="text-[11px] font-bold text-zinc-200 truncate">{rev.userName}</div>
                          <div className="text-[9px] text-zinc-500 font-mono">{new Date(rev.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map(st => (
                            <Star key={st} size={9} className={st <= rev.rating ? "text-amber-500 fill-amber-500 font-black" : "text-zinc-700"} />
                          ))}
                        </div>
                      </div>
                      <p className="font-sans text-[11px] text-zinc-350 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add review form */}
              <div className="lg:col-span-5 bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wide">Añadir tu Opinión Técnica</h3>
                  <p className="text-[10px] text-zinc-500">Compón una valoración pública sincera para orientar a otros compradores.</p>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400">Puntaje estrellas:</span>
                    <div className="flex gap-1 select-none">
                      {[1, 2, 3, 4, 5].map(sc => (
                        <button
                          key={sc}
                          onClick={() => setNewReviewRating(sc)}
                          className="text-zinc-600 hover:scale-110 active:scale-90 transition-all cursor-pointer font-black shrink-0"
                        >
                          <Star size={16} className={sc <= newReviewRating ? "text-amber-500 fill-amber-500" : "text-zinc-700 hover:text-amber-500/60"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    required
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Ej. Excelente compresión de cilindro en Ducati, encajó perfectamente en Bayamo..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 font-sans text-xs text-zinc-300 focus:outline-none focus:border-red-500 h-20 resize-none"
                  />

                  <button
                    onClick={handleSubmitReview}
                    disabled={isReviewSubmitting || !newReviewComment.trim()}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white font-sans text-xs font-bold rounded-xl cursor-pointer shadow-md select-none transition-all flex items-center justify-center gap-2"
                  >
                    {isReviewSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={11} />
                        <span>Enviar Reseña Autorizada</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related products */}
        {nextProducts.length > 0 && (
          <div className="space-y-4 pb-8">
            <h3 className="font-sans font-bold text-sm text-zinc-300 uppercase tracking-wider">Productos Relacionados</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {nextProducts.map(rel => (
                <a
                  key={rel.id}
                  href={`/producto/${rel.id}`}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors group block"
                >
                  <div className="aspect-square bg-zinc-950 overflow-hidden">
                    <img src={rel.image} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                  <div className="p-3 space-y-1">
                    <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest block">{rel.category}</span>
                    <h4 className="font-sans font-bold text-xs text-zinc-200 truncate">{rel.name}</h4>
                    <span className="font-mono font-black text-red-500 text-xs block">${rel.price.toLocaleString()} {rel.currency || 'USD'}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
