import Link from 'next/link';
import { getProductsFromDb } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

async function getProducts() {
  const products = await getProductsFromDb({ status: 'active', limit: 3 });
  return products || [];
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="bg-stone-50">
      
      {/* Hero Banner */}
      <section className="relative bg-stone-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1602523961358-f9f03dd557db?q=80&w=2000&auto=format&fit=crop" 
              alt="Cozy candle atmosphere" 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-900/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-48">
          <div className="max-w-2xl animate-slide-up">
            <span className="inline-block py-1 px-3 rounded-full bg-primary-500/20 text-primary-200 text-sm font-bold tracking-widest uppercase mb-6 backdrop-blur-sm border border-primary-500/30">
              Hand-Poured in India
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight tracking-tight text-white">
              Illuminate Your <br/>
              <span className="text-primary-300 italic">Sanctuary</span>
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-stone-200 font-light leading-relaxed max-w-lg">
              Crafted with sustainable soy wax and essential oils to turn everyday moments into cherished rituals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products" className="btn btn-primary bg-white text-stone-900 hover:bg-stone-100 border-none px-8 py-4 text-lg">
                Shop Collection
              </Link>
              <Link href="/about" className="btn btn-secondary bg-transparent border-white text-white hover:bg-white/10 px-8 py-4 text-lg">
                Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      

      {/* Featured Collection / Collections Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-primary-600 font-bold tracking-widest uppercase text-xs mb-2 block">Curated Scents</span>
          <h2 className="text-4xl font-serif font-medium text-stone-900">Explore Our Collections</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Collection 1 */}
          <Link href="/products?category=Floral" className="group relative h-96 overflow-hidden rounded-xl cursor-pointer">
            <img 
              src="https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=800&auto=format&fit=crop" 
              alt="Floral Collection" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
            <div className="absolute bottom-8 left-8 text-white">
              <h3 className="text-2xl text-white/80 font-serif mb-2">Floral Notes</h3>
              <p className="text-white/80 text-sm mb-4">Gardenia, Rose, & Jasmine</p>
              <span className="inline-block border-b border-white pb-1 text-sm font-medium">Shop Floral</span>
            </div>
          </Link>

          {/* Collection 2 */}
          <Link href="/products?category=Woody" className="group relative h-96 overflow-hidden rounded-xl cursor-pointer">
            <img 
              src="https://images.unsplash.com/photo-1577025728734-7ec67bdb97d0?q=80&w=2950&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
              alt="Woody Collection" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
            <div className="absolute bottom-8 left-8 text-white">
              <h3 className="text-2xl text-white/80 font-serif mb-2">Earthy & Woody</h3>
              <p className="text-white/80 text-sm mb-4">Sandalwood, Pine, & Amber</p>
              <span className="inline-block border-b border-white pb-1 text-sm font-medium">Shop Earthy</span>
            </div>
          </Link>

          {/* Collection 3 */}
          <Link href="/products?category=Fresh" className="group relative h-96 overflow-hidden rounded-xl cursor-pointer">
            <img 
              src="https://images.unsplash.com/photo-1612293905607-b003de9e54fb?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
              alt="Fresh Collection" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
            <div className="absolute bottom-8 left-8 text-white">
              <h3 className="text-2xl text-white/80 font-serif mb-2">Fresh & Clean</h3>
              <p className="text-white/80 text-sm mb-4">Linen, Sea Salt, & Citrus</p>
              <span className="inline-block border-b border-white pb-1 text-sm font-medium">Shop Fresh</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Brand Values / Why Choose Us */}
      <section className="bg-white py-24 border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>
              </div>
              <h3 className="text-xl font-serif mb-3">Sustainably Sourced</h3>
              <p className="text-stone-500 leading-relaxed">Made with 100% natural soy wax and lead-free cotton wicks for a clean, eco-friendly burn.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
              </div>
              <h3 className="text-xl font-serif mb-3">Hand-Poured with Love</h3>
              <p className="text-stone-500 leading-relaxed">Each candle is crafted in small batches in our studio to ensure the highest quality and care.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/></svg>
              </div>
              <h3 className="text-xl font-serif mb-3">Premium Fragrances</h3>
              <p className="text-stone-500 leading-relaxed">We use only phthalate-free, premium fragrance oils infused with essential oils.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-primary-600 font-bold tracking-widest uppercase text-xs mb-2 block">Best Sellers</span>
              <h2 className="text-4xl font-serif font-medium text-stone-900">Trending Now</h2>
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-2 text-stone-600 font-medium hover:text-primary-600 transition-colors">
              View All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product: any) => (
               <ProductCard key={product._id} product={product} />
            ))}
         </div>

         <div className="mt-12 text-center md:hidden">
            <Link href="/products" className="btn btn-secondary inline-flex w-full justify-center">View All Products</Link>
         </div>
      </section>

      

      {/* Story / About Section */}
      <section className="relative py-24 bg-stone-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-40">
           <img 
             src="https://images.unsplash.com/photo-1546551812-9a44595c5fea?q=80&w=1035&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
             alt="Candle making" 
             className="w-full h-full object-cover" 
           />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
           <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-bold tracking-widest uppercase mb-8">Our Philosophy</span>
           <h2 className="text-3xl md:text-5xl font-serif font-medium mb-8 leading-tight text-white/80">
             "We believe in the power of scent to <br className="hidden md:block" /> transform a space and uplift the spirit."
           </h2>
           <p className="max-w-2xl mx-auto text-lg text-stone-300 mb-10 leading-relaxed">
             LittleFlame began with a simple mission: to create candles that are as kind to the planet as they are delightful to the senses. Every candle is a labor of love, designed to bring a touch of magic to your daily routine.
           </p>
           <Link href="/about" className="btn btn-primary bg-white text-stone-900 hover:bg-stone-100 border-none inline-flex">
             Read Our Full Story
           </Link>
        </div>
      </section>
          
      
    </div>
  );
}
