import Swal from 'sweetalert2';

export const showAlert = (title: string, text: string = '', icon: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonColor: '#5F3B8F',
    background: '#ffffff',
    color: '#0e0b16',
    customClass: {
      popup: 'rounded-[24px] shadow-xl border border-black/5',
      confirmButton: 'px-6 py-2.5 rounded-full font-bold text-sm transition-all',
    }
  });
};
