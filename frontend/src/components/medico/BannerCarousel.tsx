import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiListBanners, type BannerPlacement } from "../../lib/api/banners";

/** Carrossel de banners full-bleed — mesma ideia do peptideo (autoplay 5s, setas, dots). */
export function BannerCarousel({
  placement,
  fallback,
}: {
  placement: BannerPlacement;
  /** Renderizado quando não há banners cadastrados para esse placement. */
  fallback: React.ReactNode;
}) {
  const { data: banners = [] } = useQuery({
    queryKey: ["banners", placement],
    queryFn: () => apiListBanners(placement),
  });

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return <>{fallback}</>;

  return (
    <div className="relative h-56 overflow-hidden rounded-2xl border border-line sm:h-72">
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="relative h-full w-full shrink-0">
            <img src={banner.imageUrl} alt={banner.title ?? ""} className="h-full w-full object-cover" />
            {(banner.title || banner.subtitle) && (
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6">
                {banner.title && <h2 className="font-display text-xl text-brand-white sm:text-2xl">{banner.title}</h2>}
                {banner.subtitle && <p className="mt-1 max-w-lg text-sm text-white/80">{banner.subtitle}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            aria-label="Slide anterior"
            onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
            className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="Próximo slide"
            onClick={() => setIndex((i) => (i + 1) % banners.length)}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                aria-label={`Ir para slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
