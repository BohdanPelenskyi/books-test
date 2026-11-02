import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

// Strict mode mirrors the mailer config: a missing variable throws instead of rendering blank.
function render(template: string, context: object): string {
  const source = readFileSync(join(__dirname, 'templates', `${template}.hbs`), 'utf8');
  return Handlebars.compile(source, { strict: true })(context);
}

describe('mail templates', () => {
  it('renders the exchange request with sender, message and books', () => {
    const html = render('exchange-request', {
      ownerName: 'Anna',
      requesterName: 'Petro',
      requesterEmail: 'petro@example.com',
      desiredBook: { name: 'Dune', author: 'Frank Herbert' },
      requesterBooks: [{ name: '1984', author: 'George Orwell' }],
      message: 'Привіт!',
      exchangesUrl: 'http://localhost:3000/exchanges',
    });

    expect(html).toContain('petro@example.com');
    expect(html).toContain('1984 — George Orwell');
    expect(html).toContain('Привіт!');
    expect(html).toContain('href="http://localhost:3000/exchanges"');
  });

  it('omits the message block when there is no message', () => {
    const html = render('exchange-request', {
      ownerName: 'Anna',
      requesterName: 'Petro',
      requesterEmail: 'petro@example.com',
      desiredBook: { name: 'Dune', author: 'Frank Herbert' },
      requesterBooks: [],
      message: null,
      exchangesUrl: 'http://localhost:3000/exchanges',
    });

    expect(html).not.toContain('<blockquote');
  });

  it('escapes user-provided text', () => {
    const html = render('exchange-request', {
      ownerName: 'Anna',
      requesterName: '<script>alert(1)</script>',
      requesterEmail: 'petro@example.com',
      desiredBook: { name: 'Dune', author: 'Frank Herbert' },
      requesterBooks: [],
      message: null,
      exchangesUrl: 'http://localhost:3000/exchanges',
    });

    expect(html).not.toContain('<script>');
  });

  it.each([
    [true, 'прийнято'],
    [false, 'відхилено'],
  ])('renders the exchange status for isAccepted=%s', (isAccepted, word) => {
    const html = render('exchange-status', {
      requesterName: 'Petro',
      ownerName: 'Anna',
      bookName: 'Dune',
      isAccepted,
      exchangesUrl: 'http://localhost:3000/exchanges',
    });

    expect(html).toContain(`Запит на обмін ${word}`);
  });

  it('renders the password reset link', () => {
    const html = render('reset-password', {
      name: 'Anna',
      resetUrl: 'http://localhost:3000/reset-password?token=abc',
    });

    // Handlebars escapes '=' inside attributes; mail clients decode it back.
    expect(html).toContain('reset-password?token&#x3D;abc');
  });
});
