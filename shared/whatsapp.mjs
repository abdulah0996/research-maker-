export function whatsappLink(number, message, enquiry, name = 'ResearchMaker') {
  const digits = number.replace(/^\+/, '')
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null
  const text = enquiry ? 'Hello ' + name + ', I am interested in ' + enquiry + '. Could you please share more information?' : message
  return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(text)
}

export function formatWhatsAppNumber(number) {
  const digits = number.replace(/^\+/, '')
  if (!/^[1-9]\d{7,14}$/.test(digits)) return ''
  return /^447\d{9}$/.test(digits)
    ? '+' + digits.slice(0, 2) + ' ' + digits.slice(2, 6) + ' ' + digits.slice(6)
    : '+' + digits
}
