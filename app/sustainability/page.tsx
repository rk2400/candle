export default function SustainabilityPage() {
  return (
    <div className="bg-stone-50 min-h-screen">
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden bg-stone-900">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1513521777634-9efa3f6022ac?q=80&w=1600&auto=format&fit=crop"
            alt="Sustainable materials"
            className="w-full h-full object-cover opacity-50"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <span className="block text-white/80 text-sm font-bold tracking-[0.2em] uppercase mb-2">Responsibly Crafted</span>
          <h1 className="text-4xl md:text-5xl font-serif text-white leading-tight">Sustainability</h1>
        </div>
      </section>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="card p-6">
            <h3 className="text-xl font-serif text-stone-900 mb-3">Wax & Wicks</h3>
            <p className="text-stone-600">We use 100% natural soy wax and lead-free cotton wicks for a clean burn with low soot and minimal indoor emissions.</p>
          </div>
          <div className="card p-6">
            <h3 className="text-xl font-serif text-stone-900 mb-3">Fragrances</h3>
            <p className="text-stone-600">Our scents are phthalate-free and infused with essential oils. We source from suppliers who follow IFRA safety standards.</p>
          </div>
          <div className="card p-6">
            <h3 className="text-xl font-serif text-stone-900 mb-3">Packaging</h3>
            <p className="text-stone-600">Reusable glass jars and recyclable cartons. We avoid plastic where possible and choose paper from responsibly managed forests.</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 mb-12">
          <h2 className="text-2xl font-serif text-stone-900 mb-4">Our Approach</h2>
          <p className="text-stone-600 leading-relaxed">
            As a small business, we make thoughtful choices that balance quality, safety, and ecological impact. We produce in small batches to reduce waste, prefer local suppliers to cut transport footprint, and continuously audit materials to improve sustainability without compromising the experience.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card p-8">
            <h3 className="text-xl font-serif text-stone-900 mb-3">Care & Reuse</h3>
            <ul className="space-y-2 text-stone-600">
              <li>Trim wicks to 5–7mm before lighting for optimal burn.</li>
              <li>Allow full melt pool to avoid tunneling and extend candle life.</li>
              <li>Clean and repurpose jars for storage, planters, or decor.</li>
            </ul>
          </div>
          <div className="card p-8">
            <h3 className="text-xl font-serif text-stone-900 mb-3">Community & Transparency</h3>
            <p className="text-stone-600">
              We share sourcing details whenever possible and welcome feedback. If you have ideas to help us improve, reach us via the contact page—your input shapes our journey.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
