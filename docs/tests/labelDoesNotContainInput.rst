===============================
Label" elements should not contain an input element
===============================

Severity code: 1

.. php:class:: labelDoesNotContainInput

<p><code>Label</code> elements should not contain an <code>input</code> element as well.</p><h4>Example</h4><h5>Wrong</h5><p><code>&lt;label for="first_name"&gt;First name: &lt;input type="text" id="first_name" name="first_name"/&gt;&lt;/label&gt;</code></p><h5>Right</h5><p><code>&lt;label for="first_name"&gt;First name: &lt;/label&gt;&lt;input type="text" id="first_name" name="first_name"/&gt;</code></p>
