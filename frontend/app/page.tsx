export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="mx-auto w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/10 backdrop-blur sm:p-12">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
          TarkSastra
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          Build the product here.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
          The Next.js starter content has been removed. This app is now a clean
          shell ready for your actual pages, components, and data flow.
        </p>
      </section>
    </main>
  );
}
