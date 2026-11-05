import { useEffect, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { DEMOS } from '../demos/registry';

export default function Gallery() {
  useEffect(() => {
    document.title = 'BAHA 3D Showcase';
  }, []);
  return (
    <main className="gallery" data-testid="gallery">
      <header>
        <h1>
          BAHA <em>3D</em>
          <br />
          Showcase
        </h1>
        <p>Năm trải nghiệm WebGL thời gian thực — kéo để xoay, đổi màu trực tiếp trên mô hình, rê chuột để làm sáng, cuộn để dẫn camera.</p>
      </header>
      <ul className="gallery-list">
        {DEMOS.map((d) => (
          <li key={d.id}>
            <Link to={d.path} className="gallery-row" data-testid={`gallery-link-${d.id}`} style={{ '--tile': d.tile, '--tile-ink': d.tileInk } as CSSProperties}>
              <span className="no">{d.no}</span>
              <span className="name">
                {d.name}
                <span className="arrow" aria-hidden>→</span>
              </span>
              <span className="meta">{d.tagline}</span>
            </Link>
          </li>
        ))}
      </ul>
      <footer>
        <span>BAHA GROUP · Frontend 3D demo</span>
        <span>React · Three.js · GSAP ScrollTrigger</span>
      </footer>
    </main>
  );
}
