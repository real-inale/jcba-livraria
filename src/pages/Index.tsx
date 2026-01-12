import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { FeaturedBooks } from '@/components/home/FeaturedBooks';
import { SellerCTA } from '@/components/home/SellerCTA';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <CategoriesSection />
      <FeaturedBooks />
      <SellerCTA />
    </Layout>
  );
};

export default Index;
