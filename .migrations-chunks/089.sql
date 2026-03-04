INSERT INTO public.audit_logs (
      entity_type,
      entity_id,
      action,
      changed_by,
      old_values,
      new_values,
      changed_at
    ) VALUES (
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      action_type,
      COALESCE(auth.uid(), (SELECT id FROM public.users LIMIT 1)), -- fallback if no auth context
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
      NOW()
    );