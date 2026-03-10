import AuthWrapper from "@/components/AuthWrapper";
import MainApp from "@/components/MainApp";

export default function Home() {
  return (
    <AuthWrapper>
      <MainApp />
    </AuthWrapper>
  );
}
