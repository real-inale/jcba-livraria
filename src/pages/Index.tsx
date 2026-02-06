import { Layout } from '@/components/layout/Layout';
import { Hero3D } from '@/components/marketplace/Hero3D';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { FeaturedBooks } from '@/components/home/FeaturedBooks';
import { SellerCTA } from '@/components/home/SellerCTA';

const Index = () => {
  return (
    <Layout>
      <Hero3D />
      <CategoriesSection />
      <FeaturedBooks />
      <SellerCTA />
    </Layout>
  );
};

export default Index;
