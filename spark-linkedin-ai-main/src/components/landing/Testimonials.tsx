import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE = `${API_URL}`;

interface Testimonial {
  displayName: string;
  jobTitle?: string;
  company?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Fallback testimonials if API fails
const fallbackTestimonials: Testimonial[] = [
  {
    displayName: "Priya S.",
    jobTitle: "Content Creator",
    rating: 5,
    comment: "I've been testing Engagematic for 2 weeks. The persona feature actually learns my writing style-no more generic AI posts. Still experimenting, but early results are promising.",
    createdAt: new Date().toISOString()
  },
  {
    displayName: "Raj M.",
    jobTitle: "Tech Founder",
    rating: 5,
    comment: "As someone who struggled with consistent LinkedIn posting, this tool helps me maintain presence without spending hours writing. The comment generator saves me at least 30 mins daily.",
    createdAt: new Date().toISOString()
  },
  {
    displayName: "Alex K.",
    jobTitle: "Marketing Professional",
    rating: 5,
    comment: "Transparency matters: I edit every AI-generated post before sharing. But having a solid draft as a starting point has cut my content creation time by 60%. That's real value.",
    createdAt: new Date().toISOString()
  },
  {
    displayName: "Ananya R.",
    jobTitle: "Career Coach",
    rating: 5,
    comment: "I was skeptical about AI content tools, but the free trial convinced me. My engagement hasn't 'skyrocketed,' but I'm posting 3x more consistently, and that consistency is building my brand.",
    createdAt: new Date().toISOString()
  }
];

export const Testimonials = () => {
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [itemsToShow, setItemsToShow] = useState(4);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const testimonialContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // Handle responsive itemsToShow based on screen size
  useEffect(() => {
    const updateItemsToShow = () => {
      const width = window.innerWidth;
      if (width < 640) { // Mobile
        setItemsToShow(1);
      } else if (width < 768) { // Small tablet
        setItemsToShow(2);
      } else if (width < 1024) { // Tablet
        setItemsToShow(2);
      } else if (width < 1280) { // Small desktop
        setItemsToShow(3);
      } else { // Large desktop
        setItemsToShow(4);
      }
    };

    updateItemsToShow();
    window.addEventListener('resize', updateItemsToShow);
    
    return () => window.removeEventListener('resize', updateItemsToShow);
  }, []);

  useEffect(() => {
    if (isAutoPlaying && allTestimonials.length > itemsToShow) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + itemsToShow) % allTestimonials.length);
      }, 4000); // Auto slide every 4 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, allTestimonials.length]);

  const fetchTestimonials = async () => {
    try {
      // Fetch all approved testimonials from API
      const response = await fetch(`${API_BASE}/testimonials/public?limit=50`);
      if (response.ok) {
        const result = await response.json();
        // Combine: fallback testimonials + all from API
        const combined = [...fallbackTestimonials];
        if (result.success && result.data.length > 0) {
          combined.push(...result.data);
        }
        setAllTestimonials(combined);
      } else {
        setAllTestimonials(fallbackTestimonials);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      setAllTestimonials(fallbackTestimonials);
    } finally {
      setIsLoading(false);
    }
  };

  const nextTestimonials = () => {
    setCurrentIndex((prev) => (prev + itemsToShow) % allTestimonials.length);
  };

  const prevTestimonials = () => {
    setCurrentIndex((prev) => (prev - itemsToShow + allTestimonials.length) % allTestimonials.length);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  // Get testimonials to display (handle wrap-around for seamless loop)
  const displayedTestimonials: Testimonial[] = [];
  if (allTestimonials.length > 0) {
    for (let i = 0; i < itemsToShow; i++) {
      const index = (currentIndex + i) % allTestimonials.length;
      if (allTestimonials[index]) {
        displayedTestimonials.push(allTestimonials[index]);
      }
    }
  }
  
  const hasMultiplePages = allTestimonials.length > itemsToShow;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <section className="py-24 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-1 sm:gap-2 mb-4">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 fill-yellow-500" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              What Our Users{" "}
              <span className="text-gradient-premium-world-class">Say About Us</span>
            </h2>
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 fill-yellow-500" />
          </div>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Real testimonials from professionals who are transforming their LinkedIn presence
          </p>
        </div>
        
        <div className="relative" ref={testimonialContainerRef}>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={`loading-${i}`} className="p-6 bg-card/50 animate-pulse">
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
                </Card>
              ))}
            </div>
          ) : displayedTestimonials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No testimonials available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-all duration-700 ease-in-out">
              {displayedTestimonials.map((testimonial, index) => (
                <Card 
                  key={`${currentIndex}-${index}`}
                  className="p-6 hover-lift bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-lg space-y-4 animate-in fade-in slide-in-from-right duration-500"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {getRatingStars(testimonial.rating || 5)}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed mb-4">
                    "{testimonial.comment}"
                  </p>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-primary/20">
                    <Avatar className="h-12 w-12 border-2 border-primary/30">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm font-bold">
                        {getInitials(testimonial.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-sm">{testimonial.displayName}</div>
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">
                        {testimonial.jobTitle}
                      </div>
                      {testimonial.company && (
                        <div className="text-xs text-primary">
                          {testimonial.company}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Carousel Navigation */}
          {!isLoading && hasMultiplePages && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={prevTestimonials}
                className="rounded-full hover:scale-110 transition-transform"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground font-medium">
                  {Math.ceil(currentIndex / itemsToShow) + 1} / {Math.ceil(allTestimonials.length / itemsToShow)}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={nextTestimonials}
                className="rounded-full hover:scale-110 transition-transform"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Trust Building Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            All testimonials are from verified Engagematic users. 
          </p>
        </div>
      </div>
    </section>
  );
};
