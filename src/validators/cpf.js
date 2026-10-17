function onlyDigits(value) {
  return String(value).replace(/\D/g, '');
}

function isValidCpf(value) {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11) return false;
  // 111.111.111-11 e afins passam na conta mas não existem
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const checkDigit = (length) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(cpf[i]) * (length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return checkDigit(9) === Number(cpf[9]) && checkDigit(10) === Number(cpf[10]);
}

module.exports = { onlyDigits, isValidCpf };
