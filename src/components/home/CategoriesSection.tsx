import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, GraduationCap, Heart, Briefcase, Clock, Feather, Church, Laptop, Sparkles, Baby } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/lib/types';

const categoryIcons: Record<string, React.ReactNode> = {
  'ficcao': <BookOpen className="h-6 w-6" />,
  'nao-ficcao': <Briefcase className="h-6 w-6" />,
  'infantil': <Baby className="h-6 w-6" />,
  'educacao': <GraduationCap className="h-6 w-6" />,
  'negocios': <Briefcase className="h-6 w-6" />,
  'historia': <Clock className="h-6 w-6" />,
  'poesia': <Feather className="h-6 w-6" />,
  'religiao': <Church className="h-6 w-6" />,
  'tecnologia': <Laptop className="h-6 w-6" />,
  'autoajuda': <Sparkles className="h-6 w-6" />,
};

export function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (data) {
        setCategories(data as Category[]);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section className="py-16 bg-secondary/30">
      <div className="w-full px-4 md:px-12 lg:px-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              Explorar Categorias
            </h2>
            <p className="mt-1 text-muted-foreground">
              Encontre o livro perfeito por categoria
            </p>
          </div>
          <Link
            to="/categorias"
            className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categories.slice(0, 10).map((category) => (
            <Link
              key={category.id}
              to={`/livros?categoria=${category.slug}`}
              className="group flex flex-col items-center gap-3 rounded-xl bg-card p-6 text-center transition-all hover:shadow-elevated hover:-translate-y-1"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {categoryIcons[category.slug] || <BookOpen className="h-6 w-6" />}
              </div>
              <span className="font-medium text-foreground">{category.name}</span>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            to="/categorias"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todas as categorias
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
