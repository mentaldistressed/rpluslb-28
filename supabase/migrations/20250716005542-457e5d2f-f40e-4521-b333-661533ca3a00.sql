-- Создание недостающих RLS политик только для таблиц, где их нет

-- RLS политики для таблицы tickets (создаем только те, которых нет)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'tickets' 
    AND policyname = 'Users can view tickets they created or if they are admin'
  ) THEN
    CREATE POLICY "Users can view tickets they created or if they are admin" 
    ON public.tickets 
    FOR SELECT 
    USING (
      auth.uid() = created_by OR 
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'tickets' 
    AND policyname = 'Only authenticated users can create tickets'
  ) THEN
    CREATE POLICY "Only authenticated users can create tickets" 
    ON public.tickets 
    FOR INSERT 
    WITH CHECK (
      auth.uid() IS NOT NULL AND 
      auth.uid() = created_by
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'tickets' 
    AND policyname = 'Users can update their own tickets or if they are admin'
  ) THEN
    CREATE POLICY "Users can update their own tickets or if they are admin" 
    ON public.tickets 
    FOR UPDATE 
    USING (
      auth.uid() = created_by OR 
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'tickets' 
    AND policyname = 'Only admins can delete tickets'
  ) THEN
    CREATE POLICY "Only admins can delete tickets" 
    ON public.tickets 
    FOR DELETE 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  END IF;
END $$;

-- RLS политики для таблицы messages
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'messages' 
    AND policyname = 'Users can view messages from tickets they have access to'
  ) THEN
    CREATE POLICY "Users can view messages from tickets they have access to" 
    ON public.messages 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.tickets 
        WHERE id = messages.ticket_id AND (
          created_by = auth.uid() OR 
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        )
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'messages' 
    AND policyname = 'Users can create messages for tickets they have access to'
  ) THEN
    CREATE POLICY "Users can create messages for tickets they have access to" 
    ON public.messages 
    FOR INSERT 
    WITH CHECK (
      auth.uid() IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.tickets 
        WHERE id = messages.ticket_id AND (
          created_by = auth.uid() OR 
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        )
      )
    );
  END IF;
END $$;

-- RLS политики для таблицы ticket_ratings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ticket_ratings' 
    AND policyname = 'Users can view ratings for tickets they have access to'
  ) THEN
    CREATE POLICY "Users can view ratings for tickets they have access to" 
    ON public.ticket_ratings 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.tickets 
        WHERE id = ticket_ratings.ticket_id AND (
          created_by = auth.uid() OR 
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        )
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ticket_ratings' 
    AND policyname = 'Users can create ratings for tickets they have access to'
  ) THEN
    CREATE POLICY "Users can create ratings for tickets they have access to" 
    ON public.ticket_ratings 
    FOR INSERT 
    WITH CHECK (
      auth.uid() IS NOT NULL AND
      auth.uid() = user_id AND
      EXISTS (
        SELECT 1 FROM public.tickets 
        WHERE id = ticket_ratings.ticket_id AND (
          created_by = auth.uid() OR 
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
          )
        )
      )
    );
  END IF;
END $$;