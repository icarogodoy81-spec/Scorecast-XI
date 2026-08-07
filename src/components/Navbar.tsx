import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav style={{ background: "#0f172a", width: "100%", justifyContent: "center" }}>
      <Link href="/" className="logo-link">
        <Image
          src="/images/logo.png"
          alt="Scorecast XI"
          width={443}
          height={319}
          priority
          style={{ width: '140px', height: 'auto' }}
        />
      </Link>
    </nav>
  );
}
