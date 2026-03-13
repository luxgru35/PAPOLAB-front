import { useForm } from 'react-hook-form';
import { Input } from '../ui/Input';
import { clientsApi } from '../../api/clients';
import type { CreateClientPayload } from '../../types/client';

export type CreateClientModalProps = {
  open: boolean;
  onClose?: () => void;
};

type CreateClientFormValues = {
  lastName: string;
  firstName: string;
  patronymic: string;
  phone: string;
  email: string;
  note: string;
  consent: boolean;
};

export function CreateClientModal({ open, onClose }: CreateClientModalProps) {
  if (!open) return null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClientFormValues>({
    mode: 'onSubmit',
    defaultValues: {
      lastName: '',
      firstName: '',
      patronymic: '',
      phone: '',
      email: '',
      note: '',
      consent: false,
    },
  });

  const onSubmit = async (values: CreateClientFormValues) => {
    const payload: CreateClientPayload = {
      last_name: values.lastName.trim(),
      first_name: values.firstName.trim(),
      middle_name: values.patronymic.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
    };

    await clientsApi.create(payload);
    onClose?.();
  };

  return (
    <div className="modal-dim" role="presentation">
      <div
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-client-modal-title"
      >
        <div className="modal-header">
          <div className="modal-title" id="create-client-modal-title">
            Новый клиент
          </div>
          <button type="button" className="modal-close" aria-label="Закрыть" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-subtitle">
          Заполните данные клиента. Поля, отмеченные *, обязательны.
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            id="create-client-last-name"
            label="Фамилия *"
            placeholder="Введите фамилию"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName', { required: 'Введите фамилию' })}
          />

          <div className="form-row">
            <Input
              id="create-client-first-name"
              label="Имя *"
              placeholder="Имя"
              autoComplete="given-name"
              error={errors.firstName?.message}
              {...register('firstName', { required: 'Введите имя' })}
            />
            <Input
              id="create-client-patronymic"
              label="Отчество"
              placeholder="Отчество"
              autoComplete="additional-name"
              error={errors.patronymic?.message}
              {...register('patronymic')}
            />
          </div>

          <Input
            id="create-client-phone"
            label="Телефон *"
            placeholder="+7 ___ ___-__-__"
            autoComplete="tel"
            inputMode="tel"
            error={errors.phone?.message}
            {...register('phone', {
              required: 'Введите телефон',
              pattern: {
                value: /^(?:\+7|8)\s*\(?\d{3}\)?[\s-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}$/,
                message: 'Некорректный номер телефона',
              },
            })}
          />

          <Input
            id="create-client-email"
            label="E-mail"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email', {
              validate: (val) => {
                if (!val) return true;
                return /^\S+@\S+\.\S+$/.test(val) || 'Некорректный email';
              },
            })}
          />

          <div className="form-group">
            <label className="form-label" htmlFor="create-client-note">
              Примечание
            </label>
            <textarea
              id="create-client-note"
              className="form-input modal-textarea"
              placeholder="Дополнительная информация..."
              {...register('note')}
            />
          </div>

          <div className="modal-consent-wrap">
            <label className={`modal-consent ${errors.consent ? 'modal-consent--error' : ''}`}>
              <input
                type="checkbox"
                className="modal-consent__input"
                {...register('consent', { required: 'Нужно согласие на обработку персональных данных' })}
              />
              <span className="modal-consent__text">
                Клиент дал согласие на обработку персональных данных (152-ФЗ)
              </span>
            </label>
            {errors.consent?.message && (
              <span className="field-error modal-consent-error">{errors.consent.message}</span>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              Создать клиента
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

