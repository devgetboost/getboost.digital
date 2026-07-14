import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1 pt-12 md:pt-14">
      {children}
    </main>
    <Footer />
  </div>
);

export default Layout;
