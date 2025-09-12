import { supabase } from '../lib/supabase';

export type BlogPosition = 'landing' | 'user';

export interface Blog {
  id: string;
  title: string;
  description: string | null;
  position: BlogPosition;
  created_at?: string;
}

export interface CreateBlogData {
  title: string;
  description?: string | null;
  position: BlogPosition;
}

export interface UpdateBlogData {
  title?: string;
  description?: string | null;
  position?: BlogPosition;
}

export class BlogService {
  static async getAll(): Promise<Blog[]> {
    const { data, error } = await supabase
      .from('blog')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch blogs: ${error.message}`);
    }

    return data || [];
  }

  static async getById(id: string): Promise<Blog | null> {
    const { data, error } = await supabase
      .from('blog')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') return null;
      throw new Error(`Failed to fetch blog: ${error.message}`);
    }

    return data;
  }

  static async getByPosition(position: BlogPosition): Promise<Blog[]> {
    const { data, error } = await supabase
      .from('blog')
      .select('*')
      .eq('position', position)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch blogs by position: ${error.message}`);
    }

    return data || [];
  }

  static async create(payload: CreateBlogData): Promise<Blog> {
    if (!['landing', 'user'].includes(payload.position)) {
      throw new Error('Invalid position. Allowed: landing, user');
    }

    const { data, error } = await supabase
      .from('blog')
      .insert({
        title: payload.title,
        description: payload.description ?? null,
        position: payload.position,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create blog: ${error.message}`);
    }

    return data as Blog;
  }

  static async update(id: string, payload: UpdateBlogData): Promise<Blog> {
    const updateData: any = {};
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.position !== undefined) updateData.position = payload.position;

    const { data, error } = await supabase
      .from('blog')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update blog: ${error.message}`);
    }

    return data as Blog;
  }

  static async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('blog')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete blog: ${error.message}`);
    }
  }
}

export default BlogService;