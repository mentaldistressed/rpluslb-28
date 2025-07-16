-- Создание RLS политик для всех таблиц

-- RLS политики для таблицы tickets
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

CREATE POLICY "Only authenticated users can create tickets" 
ON public.tickets 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = created_by
);

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

CREATE POLICY "Only admins can delete tickets" 
ON public.tickets 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- RLS политики для таблицы messages
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

-- RLS политики для таблицы profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Only admins can create profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- RLS политики для таблицы ticket_ratings
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

-- RLS политики для таблицы message_reads
CREATE POLICY "Users can view their own message reads" 
ON public.message_reads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark messages as read" 
ON public.message_reads 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  auth.uid() = user_id
);

-- RLS политики для system_settings (только админы)
CREATE POLICY "Only admins can view system settings" 
ON public.system_settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can modify system settings" 
ON public.system_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- RLS политики для changelog_entries (все могут читать, только админы редактировать)
CREATE POLICY "Everyone can view changelog entries" 
ON public.changelog_entries 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify changelog entries" 
ON public.changelog_entries 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update changelog entries" 
ON public.changelog_entries 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete changelog entries" 
ON public.changelog_entries 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);