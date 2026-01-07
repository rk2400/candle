// Header and Footer are provided by `app/layout.tsx`

export default function AboutPage() {
  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-stone-900">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1602523961358-f9f03dd557db?q=80&w=2000&auto=format&fit=crop" 
            alt="Candle making studio" 
            className="w-full h-full object-cover opacity-50"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <span className="block text-white/80 text-sm font-bold tracking-[0.2em] uppercase mb-4">Our Essence</span>
          <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight">Crafting Light, <br/> Creating Atmosphere</h1>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl font-serif text-stone-900 mb-6">The AuraFarm Story</h2>
            <div className="prose prose-stone text-lg text-stone-600 leading-relaxed space-y-6">
              <p>
                AuraFarm began with a simple yet profound realization: the right scent has the power to transform a house into a home. 
                What started as a personal passion for blending essential oils in a small kitchen has grown into a curated collection of 
                artisanal candles, each designed to evoke specific memories and emotions.
              </p>
              <p>
                We believe in the beauty of slow living. In a world that often moves too fast, lighting a candle is a ritual—a moment 
                to pause, breathe, and reconnect with yourself and your surroundings.
              </p>
            </div>
          </div>
          <div className="order-1 md:order-2 relative h-[500px] rounded-2xl overflow-hidden shadow-xl">
            <img 
              src="https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=800&auto=format&fit=crop" 
              alt="Hand pouring candles" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white rounded-3xl p-12 md:p-20 shadow-sm border border-stone-100 mb-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-serif text-stone-900 mb-4">Our Commitments</h2>
            <p className="text-stone-500">
              We hold ourselves to the highest standards, ensuring every product is as kind to the planet as it is delightful to your senses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <ValueCard 
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />}
              title="Clean Burning"
              description="100% natural soy wax and lead-free cotton wicks for a soot-free experience."
            />
            <ValueCard 
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
              title="Sustainable Sourcing"
              description="Ethically sourced ingredients and recyclable packaging materials."
            />
            <ValueCard 
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
              title="Artisan Crafted"
              description="Hand-poured in small batches to ensure superior quality and consistency."
            />
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 h-96 md:h-[600px]">
          <div className="h-full rounded-2xl overflow-hidden relative group">
            <img src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800&auto=format&fit=crop" alt="Gallery 1" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </div>
          <div className="h-full rounded-2xl overflow-hidden relative group md:mt-12">
            <img src="https://images.unsplash.com/photo-1602523961358-f9f03dd557db?q=80&w=800&auto=format&fit=crop" alt="Gallery 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </div>
          <div className="h-full rounded-2xl overflow-hidden relative group">
            <img src="https://images.unsplash.com/photo-1526318472351-c75fcf070d2f?q=80&w=800&auto=format&fit=crop" alt="Gallery 3" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </div>
        </div>
      </main>
    </div>
  );
}

function ValueCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </div>
      <h3 className="text-xl font-serif text-stone-900 mb-3">{title}</h3>
      <p className="text-stone-500 leading-relaxed">{description}</p>
    </div>
  );
}
