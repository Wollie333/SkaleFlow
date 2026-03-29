import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserWorkspaces } from '@/lib/permissions';
import { validateWorkspaceCreation } from '@/lib/workspace-limits';

/**
 * GET /api/workspaces
 * Returns all workspaces the user has access to.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    // Get all workspaces user has access to
    const workspaces = await getUserWorkspaces(
      membership.organization_id,
      user.id
    );

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces
 * Creates a new workspace.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    // Validate workspace creation (checks permissions and limits)
    try {
      await validateWorkspaceCreation(membership.organization_id, user.id);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: validationError.message },
        { status: 403 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug already exists for this org
    const { data: existingSlug } = await supabase
      .from('workspaces')
      .select('id')
      .eq('organization_id', membership.organization_id)
      .eq('slug', slug)
      .single();

    if (existingSlug) {
      // Append a random number to make it unique
      const uniqueSlug = `${slug}-${Math.floor(Math.random() * 10000)}`;

      // Create workspace with unique slug
      const { data: workspace, error: createError } = await supabase
        .from('workspaces')
        .insert({
          organization_id: membership.organization_id,
          name: name.trim(),
          slug: uniqueSlug,
          description: description?.trim(),
          color: color || '#0891b2',
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating workspace:', createError);
        return NextResponse.json(
          { error: 'Failed to create workspace' },
          { status: 500 }
        );
      }

      // Add creator as workspace admin
      await supabase.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        organization_id: membership.organization_id,
        role: 'admin',
        added_by: user.id,
      });

      return NextResponse.json({ workspace }, { status: 201 });
    }

    // Create workspace
    const { data: workspace, error: createError } = await supabase
      .from('workspaces')
      .insert({
        organization_id: membership.organization_id,
        name: name.trim(),
        slug,
        description: description?.trim(),
        color: color || '#0891b2',
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating workspace:', createError);
      return NextResponse.json(
        { error: 'Failed to create workspace' },
        { status: 500 }
      );
    }

    // Add creator as workspace admin
    await supabase.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: user.id,
      organization_id: membership.organization_id,
      role: 'admin',
      added_by: user.id,
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
