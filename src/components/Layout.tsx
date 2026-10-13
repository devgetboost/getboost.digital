import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    {/* R18.5: the header is sticky (in-flow), so no top offset is needed. */}
    <main className="flex-1">
      {children}
    </main>
    <Footer />
  </div>
);

export default Layout;
