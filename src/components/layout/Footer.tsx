export function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">

        {/* ── Колонка 1: О компании ── */}
        <div className="footer-block">
          <div className="footer-block__title">О компании</div>
          <div className="footer-block__body">
            <p>ООО «Чинилы»</p>
            <p>Самарская область</p>
            <p>Работаем с 2026 года</p>
          </div>
        </div>

        {/* ── Колонка 2: Контакты ── */}
        <div className="footer-block">
          <div className="footer-block__title">Контактная информация</div>
          <div className="footer-block__body">
            <p>Телефон: +7 (912) 518-15-11</p>
            <p>Email: info@chinily.ru</p>
            <p>Режим работы: Пн–Пт, 9:00–18:00</p>
          </div>
        </div>

        {/* ── Колонка 3: Реквизиты ── */}
        <div className="footer-block">
          <div className="footer-block__title">Реквизиты</div>
          <div className="footer-block__body">
            <p>ИНН: 1234567890</p>
            <p>ОГРН: 1234567890123</p>
            <p>Р/с: 40702810000000000000</p>
          </div>
        </div>

      </div>
    </footer>
  );
}